import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";
import type { CountryCode } from "@/lib/types";

// 例: /api/products?keywords=ゲーミングPC&country=JP
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords");
  const country = (searchParams.get("country") as CountryCode) || "JP";

  if (!keywords) {
    return NextResponse.json({ error: "keywords is required" }, { status: 400 });
  }

  const products = await searchProducts(keywords, country);
  return NextResponse.json({ products });
}
