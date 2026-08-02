import {
  BRAND,
  BRAND_ADDRESS_LINE,
  BRAND_TEL_HREF,
  BRAND_WHATSAPP_HREF,
} from "@/lib/brand";
import { AVAILABLE_IN_FLAGS } from "@/lib/countries";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-slate-900">
            {BRAND.appName}
          </p>
          <p className="mt-0.5 text-slate-500">by {BRAND.company}</p>
          <p className="mt-2 text-xs text-slate-400">
            Available in {AVAILABLE_IN_FLAGS.split(" ").length} countries:{" "}
            {AVAILABLE_IN_FLAGS} ·{" "}
            <a href="/countries" className="underline">
              See all
            </a>
          </p>
        </div>
        <div className="space-y-1">
          <p>{BRAND_ADDRESS_LINE}</p>
          <p>
            <a
              className="font-medium text-[var(--ru-brand)] hover:underline"
              href={BRAND_TEL_HREF}
            >
              {BRAND.phone}
            </a>
            <span className="text-slate-400"> · </span>
            <a
              className="font-medium text-[var(--ru-brand)] hover:underline"
              href={BRAND_WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </p>
          <p>
            <a
              className="font-medium text-[var(--ru-brand)] hover:underline"
              href={`mailto:${BRAND.email}`}
            >
              {BRAND.email}
            </a>
          </p>
          <p className="pt-2">
            <a
              href="/help"
              className="font-semibold text-black underline hover:no-underline"
            >
              Help &amp; Support
            </a>
            <span className="text-slate-400"> · </span>
            <a
              href={BRAND_WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--ru-brand)] hover:underline"
            >
              WhatsApp
            </a>
            <span className="text-slate-400"> · </span>
            <a
              href={`mailto:${BRAND.email}`}
              className="font-medium text-[var(--ru-brand)] hover:underline"
            >
              Email
            </a>
          </p>
          <p className="pt-1 text-xs">
            <a href="/privacy" className="underline hover:text-slate-900">
              Privacy
            </a>
            <span className="text-slate-400"> · </span>
            <a href="/terms" className="underline hover:text-slate-900">
              Terms
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
