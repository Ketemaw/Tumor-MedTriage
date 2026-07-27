"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export default function UploadDropzone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
        dragActive
          ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)]"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <>
          <Loader2 className="h-7 w-7 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm font-medium text-[var(--color-text)]">Analyzing scan…</p>
          <p className="text-xs text-[var(--color-text-dim)]">Running through the classification model</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-7 w-7 text-[var(--color-text-dim)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">Drop an MRI scan here, or click to browse</p>
          <p className="text-xs text-[var(--color-text-dim)]">PNG or JPEG, up to 15MB</p>
        </>
      )}
    </div>
  );
}
