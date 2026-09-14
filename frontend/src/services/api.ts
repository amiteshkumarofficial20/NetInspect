import type { AnalyzeResponse } from "../types/analysis";

const API_BASE_URL = "http://localhost:3000/api";

export async function analyzePcap(
    file: File
): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append("pcap", file);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.error || "PCAP analysis failed"
        );
    }

    return response.json();
}