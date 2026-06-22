"use client";

import { useEffect, useState } from "react";

interface Category {
  category: string;
  allocatedBudget: number;
}

const COLORS = ["#2F5DFF", "#7C5CFC", "#19B98C", "#1B3DCB", "#A78BFA", "#34D399", "#60A5FA"];

function PieSlice({
  cx, cy, r,
  startAngle, endAngle,
  color,
  animate
}: {
  cx: number; cy: number; r: number;
  startAngle: number; endAngle: number;
  color: string; animate: boolean;
}) {
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return (
    <path
      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
      fill={color}
      opacity={animate ? 1 : 0}
      style={{ transition: "opacity 0.4s ease" }}
    />
  );
}

export function BudgetPieChart({ categories }: { categories: Category[] }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const total = categories.reduce((s, c) => s + c.allocatedBudget, 0);
  const currency = "¥";

  let cumAngle = 0;
  const slices = categories.map((cat, i) => {
    const pct = cat.allocatedBudget / total;
    const angle = pct * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...cat, start, end: cumAngle, color: COLORS[i % COLORS.length], pct };
  });

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <p className="text-xs text-muted mb-3">予算配分プラン</p>
      <div className="flex items-center gap-6">
        {/* 円グラフ */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
          {slices.map((s, i) => (
            <PieSlice
              key={i}
              cx={60} cy={60} r={52}
              startAngle={s.start}
              endAngle={s.end}
              color={s.color}
              animate={animate}
            />
          ))}
          {/* 中央ラベル */}
          <circle cx="60" cy="60" r="30" fill="white" />
          <text x="60" y="57" textAnchor="middle" fontSize="8" fill="#6B7280">合計</text>
          <text x="60" y="68" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#13151B">
            {currency}{(total / 10000).toFixed(0)}万
          </text>
        </svg>

        {/* 凡例 */}
        <div className="flex-1 space-y-2">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-ink flex-1 truncate">{s.category}</span>
              <span className="text-xs font-medium font-tabular text-ink shrink-0">
                {currency}{s.allocatedBudget.toLocaleString()}
              </span>
              <span className="text-xs text-muted shrink-0">
                {(s.pct * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
