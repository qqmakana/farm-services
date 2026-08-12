import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getPamphletEntryUrl } from "@/lib/app-links";

export const runtime = "nodejs";

/**
 * QR code image for pamphlets and print — PNG by default.
 * GET /api/qr?url=...&size=400
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url")?.trim() || getPamphletEntryUrl();
  const format = searchParams.get("format") === "svg" ? "svg" : "png";
  const sizeRaw = Number(searchParams.get("size") ?? 320);
  const size = Math.min(720, Math.max(128, Number.isFinite(sizeRaw) ? sizeRaw : 320));

  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: "url must be http(s)" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(target, {
        type: "svg",
        margin: 1,
        width: size,
        errorCorrectionLevel: "M",
      });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const png = await QRCode.toBuffer(target, {
      type: "png",
      margin: 1,
      width: size,
      errorCorrectionLevel: "M",
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not generate QR" }, { status: 500 });
  }
}
