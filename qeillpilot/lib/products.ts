import type { CountryCode, ProductCandidate } from "@/lib/types";
import { searchAmazon } from "@/lib/providers/amazon";
import { searchRakuten } from "@/lib/providers/rakuten";

// 対応国ごとに、対応ECサイトへ並行で検索をかける
export async function searchProducts(
  keywords: string,
  country: CountryCode
): Promise<ProductCandidate[]> {
  if (country === "JP") {
    const [amazon, rakuten] = await Promise.all([
      searchAmazon(keywords, "JP"),
      searchRakuten(keywords)
    ]);
    return [...amazon, ...rakuten];
  }

  return searchAmazon(keywords, country);
}
