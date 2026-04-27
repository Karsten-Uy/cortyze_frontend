"use client";

import { useCallback, useRef, useState } from "react";
import { formatBytes } from "@/lib/limits";

type Props = {
  onFile: (file: File) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  accept?: string;
  /** Hard ceiling — files larger than this are rejected before they reach the consumer. */
  maxBytes?: number;
};

export function Dropzone({
  onFile,
  onError,
  disabled,
  accept = "video/*,image/*",
  maxBytes,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (maxBytes && file.size > maxBytes) {
        onError?.(
          `File too large: ${formatBytes(file.size)}. Maximum is ${formatBytes(maxBytes)}.`,
        );
        return;
      }
      onFile(file);
    },
    [onFile, onError, maxBytes],
  );

  return (
    <div
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
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
        disabled
          ? "cursor-not-allowed border-neutral-800 bg-neutral-950 opacity-50"
          : dragging
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
        Drop a video here, or click to browse
      </p>
      <p className="text-xs text-neutral-500">
        {maxBytes
          ? `Max ${formatBytes(maxBytes)} · larger files can be compressed in-browser`
          : "Direct upload to object storage via presigned URL"}
      </p>
    </div>
  );
}
