import { ImageResponse } from "next/og";
import { BrandForegroundCanvas } from "@/lib/brand-art";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<BrandForegroundCanvas size={1024} />, {
    width: 1024,
    height: 1024,
  });
}
