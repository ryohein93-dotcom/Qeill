import type { ProductCandidate } from "@/lib/types";

const RAKUTEN_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

function mockResults(keywords: string): ProductCandidate[] {
  const base = 14000;

  return Array.from({ length: 3 }).map((_, i) => ({
    id: `mock-rakuten-${i}-${encodeURIComponent(keywords)}`,
    shop: "rakuten",
    shopName: "楽天市場",
    title: `${keywords}（楽天候補 ${i + 1}）`,
    imageUrl: "https://placehold.co/300x300?text=Rakuten",
    price: Math.round(base * (1 + i * 0.3)),
    currency: "JPY",
    rating: 4.1 + i * 0.15 > 5 ? 5 : 4.1 + i * 0.15,
    reviewCount: 80 - i * 15,
    url: "https://www.rakuten.co.jp/"
  }));
}

// 日本のみ対応。楽天市場商品検索APIはアプリIDのみで呼び出せる（署名不要）。
export async function searchRakuten(keywords: string): Promise<ProductCandidate[]> {
  const appId = process.env.RAKUTEN_APP_ID;

  if (!appId) {
    return mockResults(keywords);
  }

  try {
    const url = new URL(RAKUTEN_ENDPOINT);
    url.searchParams.set("applicationId", appId);
    url.searchParams.set("keyword", keywords);
    url.searchParams.set("hits", "5");
    url.searchParams.set("sort", "-reviewCount");
    if (process.env.RAKUTEN_AFFILIATE_ID) {
      url.searchParams.set("affiliateId", process.env.RAKUTEN_AFFILIATE_ID);
    }

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error("Rakuten API error", res.status, await res.text());
      return mockResults(keywords);
    }

    const data = await res.json();
    if (!data.Items?.length) return [];

    return data.Items.map((wrapper: any): ProductCandidate => {
      const item = wrapper.Item;
      return {
        id: String(item.itemCode),
        shop: "rakuten",
        shopName: item.shopName ?? "楽天市場",
        title: item.itemName,
        imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? "",
        price: item.itemPrice,
        currency: "JPY",
        rating: item.reviewAverage ? Number(item.reviewAverage) : null,
        reviewCount: item.reviewCount ?? null,
        url: item.affiliateUrl || item.itemUrl
      };
    });
  } catch (err) {
    console.error("searchRakuten failed, falling back to mock", err);
    return mockResults(keywords);
  }
}
