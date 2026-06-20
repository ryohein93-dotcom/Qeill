import type { SelectedProduct } from "@/lib/types";

const SEGMENT_COLORS = ["bg-brand", "bg-accent", "bg-mint", "bg-brand-deep", "bg-accent/70", "bg-mint/70"];

export function BudgetBar({ items, currency }: { items: SelectedProduct[]; currency: string }) {
  const total = items.reduce((sum, item) => sum + item.product.price, 0) || 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-line">
        {items.map((item, i) => (
          <div
            key={item.category}
            className={`${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} h-full`}
            style={{ width: `${(item.product.price / total) * 100}%` }}
            title={`${item.category}: ${item.product.price.toLocaleString()} ${currency}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item, i) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`} />
            {item.category}
          </div>
        ))}
      </div>
    </div>
  );
}
