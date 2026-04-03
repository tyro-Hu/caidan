import { ImageResponse } from "next/og";
import { BrandIconCanvas } from "@/lib/brand-art";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<BrandIconCanvas size={192} />, {
    width: 192,
    height: 192,
  });
}
