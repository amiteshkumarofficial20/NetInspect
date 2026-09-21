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
const GENERATED_DIR = path.join(ROOT_DIR, "storage", "generated");
const OUTPUT_DIR = path.join(ROOT_DIR, "storage", "outputs");
const RESULTS_DIR = path.join(ROOT_DIR, "storage", "results");

const ENGINE_PATH = path.join(ROOT_DIR, "build", "engine", "dpi_engine.exe");
const SCRIPT_PATH = path.join(ROOT_DIR, "scripts", "generate_test_pcap.py");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 500 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "NetInspect Backend" });
});

// ── Shared: run DPI engine and return JSON result ─────────────────────────────

function runEngine(
  inputPath: string,
  outputPath: string,
  jsonPath: string,
  blockApp: string | undefined,
  cleanup: () => void,
  res: express.Response
) {
  if (!fs.existsSync(ENGINE_PATH)) {
    cleanup();
    res.status(500).json({ error: "DPI engine executable not found", path: ENGINE_PATH });
    return;
  }

  const args = [
    inputPath,
    outputPath,
    ...(blockApp && blockApp.trim() ? ["--block-app", blockApp.trim()] : []),
    "--json",
    jsonPath,
  ];

  const engine = spawn(ENGINE_PATH, args, { windowsHide: true });
  let stdout = "";
  let stderr = "";

  engine.stdout.on("data", (d) => { stdout += d.toString(); });
  engine.stderr.on("data", (d) => { stderr += d.toString(); });

  engine.on("error", (err) => {
    cleanup();
    res.status(500).json({ error: "Failed to start DPI engine", details: err.message });
  });

  engine.on("close", (code) => {
    cleanup();

    if (code !== 0) {
      res.status(500).json({ error: "DPI engine failed", exitCode: code, stdout, stderr });
      return;
    }

    if (!fs.existsSync(jsonPath)) {
      res.status(500).json({ error: "DPI engine completed but JSON result was not created", stdout, stderr });
      return;
    }

    try {
      const result = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      res.json({ status: "ok", result });
    } catch (err) {
      res.status(500).json({
        error: "Failed to parse DPI JSON result",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

// ── POST /api/analyze — upload a PCAP file ────────────────────────────────────

app.post("/api/analyze", upload.single("pcap"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "PCAP file is required. Use form field: pcap" });
    return;
  }

  const timestamp = Date.now();
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `analysis_${timestamp}.pcap`);
  const jsonPath = path.join(RESULTS_DIR, `analysis_${timestamp}.json`);
  const blockApp = typeof req.query.blockApp === "string" ? req.query.blockApp : undefined;

  const cleanup = () => { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); };

  runEngine(inputPath, outputPath, jsonPath, blockApp, cleanup, res);
});

// ── POST /api/analyze-new — generate fresh PCAP then analyze ─────────────────

app.post("/api/analyze-new", (req, res) => {
  const timestamp = Date.now();
  const generatedPcap = path.join(GENERATED_DIR, `generated_${timestamp}.pcap`);
  const outputPath = path.join(OUTPUT_DIR, `analysis_${timestamp}.pcap`);
  const jsonPath = path.join(RESULTS_DIR, `analysis_${timestamp}.json`);
  const blockApp = typeof req.query.blockApp === "string" ? req.query.blockApp : undefined;

  // Step 1: generate the PCAP via Python script
  const generator = spawn("python", [SCRIPT_PATH, "--out", generatedPcap], { windowsHide: true });
  let genStderr = "";

  generator.stderr.on("data", (d) => { genStderr += d.toString(); });

  generator.on("error", (err) => {
    res.status(500).json({
      error: "Failed to start PCAP generator script",
      details: err.message,
      hint: "Ensure Python is installed and scripts/generate_test_pcap.py exists",
    });
  });

  generator.on("close", (code) => {
    if (code !== 0 || !fs.existsSync(generatedPcap)) {
      res.status(500).json({
        error: "PCAP generation script failed",
        exitCode: code,
        stderr: genStderr,
      });
      return;
    }

    // Step 2: run DPI engine on the generated PCAP
    const cleanup = () => {
      if (fs.existsSync(generatedPcap)) fs.unlinkSync(generatedPcap);
    };

    runEngine(generatedPcap, outputPath, jsonPath, blockApp, cleanup, res);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`NetInspect backend running on http://localhost:${PORT}`);
});
