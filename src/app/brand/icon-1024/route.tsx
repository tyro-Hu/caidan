import { ImageResponse } from "next/og";
import { BrandIconCanvas } from "@/lib/brand-art";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<BrandIconCanvas size={1024} />, {
    width: 1024,
    height: 1024,
  });
}
