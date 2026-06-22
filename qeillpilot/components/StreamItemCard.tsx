"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SelectedProduct } from "@/lib/types";

const CURRENCY_SYMBOL: Record<string, string> = { JPY: "¥", USD: "$", GBP: "£" };

function formatPrice(price: number, currency: string) {
  return `${CURRENCY_SYMBOL[currency] ?? ""}${price.toLocaleString()}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="10" height="10" viewBox="0 0 10 10">
          <polygon
            points="5,1 6.2,3.8 9.5,4.1 7.2,6.2 7.9,9.5 5,7.8 2.1,9.5 2.8,6.2 0.5,4.1 3.8,3.8"
            fill={s <= Math.round(rating) ? "#FBBF24" : "#E6E4DF"}
          />
        </svg>
      ))}
    </span>
  );
}

export function StreamItemCard({ item }: { item: SelectedProduct }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const currency = item.product.currency;

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="rounded-card border border-line bg-white shadow-card overflow-hidden">
        {/* カテゴリラベル */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-line bg-brand-soft">
          <span className="text-xs font-medium text-brand">{item.category}</span>
          <span className="ml-auto text-xs text-muted">
            予算 {CURRENCY_SYMBOL[currency]}{item.allocatedBudget.toLocaleString()}
          </span>
        </div>

        <div className="flex gap-4 p-4">
          {/* 商品画像 */}
          <div className="relative w-20 h-20 shrink-0 rounded-lg border border-line overflow-hidden bg-white">
            {item.product.imageUrl ? (
              <Image
                src={item.product.imageUrl}
                alt={item.product.title}
                fill
                sizes="80px"
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-xs">No image</div>
            )}
          </div>

          {/* 商品情報 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">{item.product.shopName}</p>
            <p className="mt-0.5 text-sm font-medium text-ink line-clamp-2">{item.product.title}</p>

            {item.product.rating !== null && (
              <div className="mt-1 flex items-center gap-1.5">
                <StarRating rating={item.product.rating} />
                <span className="text-xs text-muted">
                  {item.product.rating.toFixed(1)} ({item.product.reviewCount?.toLocaleString() ?? 0}件)
                </span>
              </div>
            )}

            {/* 他ショップ価格比較バー */}
            {item.alternativePrices?.length ? (
              <div className="mt-2 rounded-md bg-line/40 px-3 py-2">
                <p className="text-xs text-muted mb-1.5">価格比較</p>
                {[{ shopName: item.product.shopName, price: item.product.price, url: item.product.url }, ...item.alternativePrices].map((p, i) => {
                  const max = Math.max(item.product.price, ...item.alternativePrices!.map((a) => a.price));
                  const pct = (p.price / max) * 100;
                  return (
                    <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                      <span className="text-xs text-muted w-16 shrink-0">{p.shopName}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-brand" : "bg-accent/60"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-ink shrink-0">
                        {formatPrice(p.price, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* 右側：価格＋ボタン */}
          <div className="shrink-0 flex flex-col items-end justify-between gap-2">
            <div className="text-right">
              <p className="text-lg font-bold font-tabular text-ink">
                {formatPrice(item.product.price, currency)}
              </p>
              {item.product.price < item.allocatedBudget && (
                <p className="text-xs text-mint">
                  予算より {formatPrice(item.allocatedBudget - item.product.price, currency)} 安い
                </p>
              )}
            </div>
            <a
              href={item.product.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-deep transition"
            >
              購入する →
            </a>
          </div>
        </div>

        {/* 選定理由 */}
        <div className="px-4 pb-4">
          <p className="text-xs text-muted leading-relaxed border-t border-line pt-3">
            💡 {item.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
