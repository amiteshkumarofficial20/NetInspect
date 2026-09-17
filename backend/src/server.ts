import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const app = express();
const PORT = 3000;

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const UPLOAD_DIR = path.join(ROOT_DIR, "storage", "uploads");
const OUTPUT_DIR = path.join(ROOT_DIR, "storage", "outputs");
const RESULTS_DIR = path.join(ROOT_DIR, "storage", "results");

const ENGINE_PATH = path.join(ROOT_DIR, "build", "engine", "dpi_engine.exe");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "NetInspect Backend",
  });
});

app.post("/api/analyze", upload.single("pcap"), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      error: "PCAP file is required. Use form field: pcap",
    });
    return;
  }

  if (!fs.existsSync(ENGINE_PATH)) {
    res.status(500).json({
      error: "DPI engine executable not found",
      path: ENGINE_PATH,
    });
    return;
  }

  const timestamp = Date.now();

  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `analysis_${timestamp}.pcap`);
  const jsonPath = path.join(RESULTS_DIR, `analysis_${timestamp}.json`);

  const args = [
    inputPath,
    outputPath,
    ...(typeof req.query.blockApp === "string" && req.query.blockApp.trim()
      ? ["--block-app", req.query.blockApp.trim()]
      : []),
    "--json",
    jsonPath,
  ];

  const engine = spawn(ENGINE_PATH, args, {
    windowsHide: true,
  });

  let stdout = "";
  let stderr = "";

  engine.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  engine.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  engine.on("error", (error) => {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    res.status(500).json({
      error: "Failed to start DPI engine",
      details: error.message,
    });
  });

  engine.on("close", (code) => {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    if (code !== 0) {
      res.status(500).json({
        error: "DPI engine failed",
        exitCode: code,
        stdout,
        stderr,
      });
      return;
    }

    if (!fs.existsSync(jsonPath)) {
      res.status(500).json({
        error: "DPI engine completed but JSON result was not created",
        stdout,
        stderr,
      });
      return;
    }

    try {
      const result = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      res.json({
        status: "ok",
        result,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to parse DPI JSON result",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`NetInspect backend running on http://localhost:${PORT}`);
});
