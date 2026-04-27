"use client";

// Browser-side video compression via FFmpeg.wasm. The library + WASM core
// is ~25 MB, so we lazy-load it on first compress to keep the initial
// bundle small (everything below uses dynamic imports). The page must be
// cross-origin isolated — see next.config.ts for the COOP/COEP headers
// FFmpeg.wasm needs to use SharedArrayBuffer.

import type { FFmpeg } from "@ffmpeg/ffmpeg";

let _ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  // CDN-hosted core. For production you may want to self-host these to
  // avoid relying on unpkg's availability.
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  _ffmpeg = ffmpeg;
  return ffmpeg;
}

/**
 * Re-encode `file` as H.264/AAC mp4 with reduced bitrate and resolution.
 *
 * - Caps width at 1280px (preserves aspect ratio)
 * - Caps frame rate at 24 fps
 * - CRF 28 ≈ visually fine for analysis, ~10x smaller than typical phone exports
 * - faststart so the output streams without waiting for full download
 *
 * Typical reduction: 100 MB iPhone clip → ~8-15 MB. Compression time is
 * roughly 0.5x real-time on a modern Mac (a 60-sec clip takes ~30 sec).
 */
export async function compressVideo(
  file: File,
  onProgress?: (frac: number) => void,
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();

  const onProgressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", onProgressHandler);

  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const inputName = `input.${ext}`;
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-vf", "scale='if(gt(iw,1280),1280,iw)':-2",
      "-r", "24",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "28",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
      "-y",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    if (typeof data === "string") {
      throw new Error("FFmpeg returned text instead of binary output");
    }
    // FFmpeg.wasm returns Uint8Array backed by SharedArrayBuffer; Blob
    // requires a regular ArrayBuffer, so we copy the bytes once.
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    const blob = new Blob([buffer], { type: "video/mp4" });
    const newName = file.name.replace(/\.[^.]+$/, "") + ".compressed.mp4";
    return new File([blob], newName, {
      type: "video/mp4",
      lastModified: Date.now(),
    });
  } finally {
    ffmpeg.off("progress", onProgressHandler);
    // Cleanup virtual filesystem so repeat compressions don't accumulate
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* ignore */
    }
  }
}
