"use client";

import { useState } from "react";

export function CopySocialCaption({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(caption);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? "Copied" : "Copy for social"}
      </button>
      <a
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-black"
        href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
        target="_blank"
        rel="noreferrer"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
