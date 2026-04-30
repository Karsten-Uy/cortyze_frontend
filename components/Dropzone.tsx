"use client";

import { useCallback, useState } from "react";
import { formatBytes } from "@/lib/limits";

type Props = {
  /** Single-file callback — used unless `multiple=true`. */
  onFile?: (file: File) => void;
  /** Multi-file callback — used when `multiple=true`. Receives the
   *  validated subset (anything over `maxBytes` is filtered + reported). */
  onFiles?: (files: File[]) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  /** Hard ceiling — files larger than this are rejected before they reach the consumer. */
  maxBytes?: number;
  /** Headline text shown inside the dropzone. Default targets video uploads. */
  label?: string;
  /** Subline shown below the label. Defaults to a size hint based on `maxBytes`. */
  subtext?: string;
};

export function Dropzone({
  onFile,
  onFiles,
  onError,
  disabled,
  accept = "video/*,image/*",
  multiple = false,
  maxBytes,
  label,
  subtext,
}: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (multiple) {
        const all = Array.from(files);
        const accepted: File[] = [];
        const rejected: File[] = [];
        for (const f of all) {
          if (maxBytes && f.size > maxBytes) rejected.push(f);
          else accepted.push(f);
        }
        if (rejected.length > 0) {
          onError?.(
            `${rejected.length} file${rejected.length === 1 ? "" : "s"} too large ` +
              `(max ${formatBytes(maxBytes!)}): ` +
              rejected
                .slice(0, 3)
                .map((f) => f.name)
                .join(", ") +
              (rejected.length > 3 ? ", …" : ""),
          );
        }
        if (accepted.length > 0) onFiles?.(accepted);
        return;
      }

      const file = files[0];
      if (maxBytes && file.size > maxBytes) {
        onError?.(
          `File too large: ${formatBytes(file.size)}. Maximum is ${formatBytes(maxBytes)}.`,
        );
        return;
      }
      onFile?.(file);
    },
    [onFile, onFiles, multiple, onError, maxBytes],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
        disabled
          ? "cursor-not-allowed border-neutral-800 bg-neutral-950 opacity-50"
          : dragging
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
      }`}
    >
      {/* Native <label>+nested <input> bridges click→picker without a manual
          .click() call, which used to bubble back up and open the picker
          twice. */}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <svg
        className="h-8 w-8 text-neutral-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.76-1.15A4.5 4.5 0 0117 16h-1m-7-3l3-3m0 0l3 3m-3-3v12"
        />
      </svg>
      <p className="text-sm font-medium text-neutral-200">
        {label ?? "Drop a video here, or click to browse"}
      </p>
      <p className="text-xs text-neutral-500">
        {subtext ??
          (maxBytes
            ? `Max ${formatBytes(maxBytes)} · larger files can be compressed in-browser`
            : "Direct upload to object storage via presigned URL")}
      </p>
    </label>
  );
}
