import Link from "next/link";
import { ChevronLeft, Home, Briefcase, MapPin } from "lucide-react";

const places = [
  { label: "Home", hint: "Add your home landmark", Icon: Home },
  { label: "Work", hint: "Add your work landmark", Icon: Briefcase },
  { label: "Village landmarks", hint: "Save places you use often", Icon: MapPin },
] as const;

export default function SavedPlacesPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-24 pt-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A4D3A] transition active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Saved Places</h1>
      <p className="mt-2 text-sm text-slate-500">
        Coming soon — pin Home, Work, and village landmarks for faster booking.
      </p>
      <ul className="mt-6 space-y-2">
        {places.map(({ label, hint, Icon }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#F9FAFB] px-4 py-4 shadow-sm"
          >
            <Icon className="h-5 w-5 text-[#1A4D3A]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
