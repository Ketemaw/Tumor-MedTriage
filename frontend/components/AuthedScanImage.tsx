"use client";

import { useEffect, useState } from "react";
import { scansApi } from "@/lib/api";
import { Skeleton } from "@/components/Primitives";

export default function AuthedScanImage({ scanId, alt, className = "" }: { scanId: number; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    scansApi
      .fetchImageBlobUrl(scanId)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        objectUrl = blobUrl;
        setUrl(blobUrl);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [scanId]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-dim)] ${className}`}>
        Image unavailable
      </div>
    );
  }

  if (!url) return <Skeleton className={className} />;

  // eslint-disable-next-line @next/next/no-img-element -- blob: URLs aren't supported by next/image
  return <img src={url} alt={alt} className={className} />;
}
