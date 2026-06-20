import crypto from "crypto";
import type { CountryCode, ProductCandidate } from "@/lib/types";

// Amazon Product Advertising API (PA-API v5) のホスト・マーケットプレイス設定
const PAAPI_CONFIG: Record<"JP" | "US" | "GB", { host: string; region: string; marketplace: string; shop: "amazon_jp" | "amazon_us" | "amazon_uk" }> = {
  JP: { host: "webservices.amazon.co.jp", region: "us-west-2", marketplace: "www.amazon.co.jp", shop: "amazon_jp" },
  US: { host: "webservices.amazon.com", region: "us-east-1", marketplace: "www.amazon.com", shop: "amazon_us" },
  GB: { host: "webservices.amazon.co.uk", region: "eu-west-1", marketplace: "www.amazon.co.uk", shop: "amazon_uk" }
};

function sign(key: Buffer, msg: string) {
  return crypto.createHmac("sha256", key).update(msg, "utf8").digest();
}

// PA-API v5 SearchItems を AWS Signature V4 で署名して呼び出す
async function callSearchItems(country: "JP" | "US" | "GB", keywords: string) {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    return null; // 未設定時は呼び出し元でモックにフォールバック
  }

  const { host, region, marketplace } = PAAPI_CONFIG[country];
  const service = "ProductAdvertisingAPI";
  const path = "/paapi5/searchitems";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

  const payload = JSON.stringify({
    Keywords: keywords,
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: marketplace,
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "CustomerReviews.StarRating",
      "CustomerReviews.Count"
    ]
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");

  const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex")
  ].join("\n");

  const kDate = sign(Buffer.from(`AWS4${secretKey}`), dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  const kSigning = sign(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      "x-amz-date": amzDate,
      "x-amz-target": target,
      authorization
    },
    body: payload
  });

  if (!res.ok) {
    console.error("PA-API error", res.status, await res.text());
    return null;
  }

  return res.json();
}

function currencyFor(country: CountryCode) {
  if (country === "JP") return "JPY";
  if (country === "GB") return "GBP";
  return "USD";
}

// 開発・デモ用のモックデータ（API未設定時のフォールバック）
function mockResults(country: CountryCode, keywords: string): ProductCandidate[] {
  const currency = currencyFor(country);
  const shop = PAAPI_CONFIG[country].shop;
  const base = country === "JP" ? 15000 : country === "GB" ? 90 : 120;

  return Array.from({ length: 3 }).map((_, i) => ({
    id: `mock-amzn-${shop}-${i}-${encodeURIComponent(keywords)}`,
    shop,
    shopName: "Amazon",
    title: `${keywords} (Amazon候補 ${i + 1})`,
    imageUrl: "https://placehold.co/300x300?text=Amazon",
    price: Math.round(base * (1 + i * 0.35)),
    currency,
    rating: 4.0 + i * 0.2 > 5 ? 5 : 4.0 + i * 0.2,
    reviewCount: 120 - i * 30,
    url: "https://www.amazon.co.jp/"
  }));
}

export async function searchAmazon(keywords: string, country: CountryCode): Promise<ProductCandidate[]> {
  if (country !== "JP" && country !== "US" && country !== "GB") return [];

  try {
    const data = await callSearchItems(country, keywords);
    if (!data?.SearchResult?.Items) {
      return mockResults(country, keywords);
    }

    const shop = PAAPI_CONFIG[country].shop;
    const currency = currencyFor(country);

    return data.SearchResult.Items.map((item: any): ProductCandidate => ({
      id: item.ASIN,
      shop,
      shopName: "Amazon",
      title: item.ItemInfo?.Title?.DisplayValue ?? keywords,
      imageUrl: item.Images?.Primary?.Large?.URL ?? "",
      price: item.Offers?.Listings?.[0]?.Price?.Amount ?? 0,
      currency,
      rating: item.CustomerReviews?.StarRating?.Value ?? null,
      reviewCount: item.CustomerReviews?.Count ?? null,
      url: item.DetailPageURL,
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue
    }));
  } catch (err) {
    console.error("searchAmazon failed, falling back to mock", err);
    return mockResults(country, keywords);
  }
}
