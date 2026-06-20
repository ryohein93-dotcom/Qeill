export type CountryCode = "JP" | "US" | "GB";
export type LocaleCode = "ja" | "en";

export type ShopCode = "amazon_jp" | "rakuten" | "amazon_us" | "amazon_uk";

export interface ProductCandidate {
  id: string;
  shop: ShopCode;
  shopName: string;
  title: string;
  imageUrl: string;
  price: number;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  url: string;
  brand?: string;
}

export interface SelectedProduct {
  category: string;
  product: ProductCandidate;
  alternativePrices?: { shop: ShopCode; shopName: string; price: number; url: string }[];
  reason: string;
  allocatedBudget: number;
}

export interface ProposalResult {
  id: string;
  title: string;
  summary: string;
  totalBudget: number;
  totalPrice: number;
  difference: number;
  country: CountryCode;
  items: SelectedProduct[];
  createdAt: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CategoryPlan {
  category: string;
  searchKeywords: string;
  allocatedBudget: number;
}

export interface AiPlan {
  needsClarification: boolean;
  clarifyingQuestion?: string;
  intentSummary: string;
  categories: CategoryPlan[];
}
