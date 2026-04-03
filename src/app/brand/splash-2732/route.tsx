import { ImageResponse } from "next/og";
import { BrandSplashCanvas } from "@/lib/brand-art";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<BrandSplashCanvas size={2732} />, {
    width: 2732,
    height: 2732,
  });
}
