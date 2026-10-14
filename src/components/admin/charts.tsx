"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/components/store-context";
import { cn } from "@/lib/utils";

type Point = { key: string; label: string; revenue: number; orders: number; profit: number };

/** Validated categorical slots (dataviz reference palette): 1 = blue, 2 = orange. */
const SERIES_1 = "#2a78d6";
const SERIES_2 = "#eb6834";
const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";

function compact(minor: number) {
  const v = minor / 100;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

function ChartTooltip({ active, payload, label, money, unit }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string; money: (n: number) => string; unit: "money" | "count" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{unit === "money" ? money(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function RangeTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="tablist" aria-label="Time range" className="inline-flex rounded-xl border bg-background p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-9 rounded-lg px-3 text-sm font-semibold", value === o.value ? "bg-foreground text-background" : "hover:bg-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Single-series revenue columns in the brand colour (no legend needed - the title names it). */
export function RevenueChart({ data }: { data: { daily: Point[]; weekly: Point[]; monthly: Point[] } }) {
  const money = useMoney();
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const points = data[range];
  const total = points.reduce((s, p) => s + p.revenue, 0);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Revenue</h2>
          <p className="text-sm text-muted-foreground">
            {range === "daily" ? "Last 30 days" : range === "weekly" ? "Last 12 weeks" : "Last 12 months"}: <strong className="text-foreground">{money(total)}</strong>
          </p>
        </div>
        <RangeTabs
          value={range}
          onChange={setRange}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      </div>
      <div className="h-72" role="img" aria-label={`Revenue chart, ${range}. Total ${money(total)}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tickFormatter={compact} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip money={money} unit="money" />} />
            <Bar dataKey="revenue" name="Revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-1 font-semibold">Period</th>
              <th className="py-1 text-right font-semibold">Orders</th>
              <th className="py-1 text-right font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key} className="border-b last:border-0">
                <td className="py-1">{p.label}</td>
                <td className="py-1 text-right tabular-nums">{p.orders}</td>
                <td className="py-1 text-right tabular-nums">{money(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Revenue vs profit - same unit, one axis, two validated categorical slots + legend. */
export function RevenueProfitChart({ data }: { data: Point[] }) {
  const money = useMoney();
  return (
    <div className="h-80" role="img" aria-label="Revenue and profit over time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={16} />
          <YAxis tickFormatter={compact} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip money={money} unit="money" />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />
          <Legend wrapperStyle={{ fontSize: 14, color: "var(--foreground)" }} iconType="plainline" />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke={SERIES_1} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="profit" name="Profit" stroke={SERIES_2} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Single-series order counts. */
export function OrdersChart({ data }: { data: Point[] }) {
  const money = useMoney();
  return (
    <div className="h-64" role="img" aria-label="Number of orders over time">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip money={money} unit="count" />} />
          <Bar dataKey="orders" name="Orders" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal ranked bars with the value at the tip (used for top products / cities). */
export function RankedBars({ rows }: { rows: { label: string; value: number; sub?: string }[] }) {
  const money = useMoney();
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-muted-foreground">No sales in this period yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 font-medium">{r.label}</span>
            <span className="shrink-0 text-right font-semibold tabular-nums">
              {money(r.value)}
              {r.sub && <span className="block text-xs font-normal text-muted-foreground">{r.sub}</span>}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div className="h-3 rounded-r-[4px] rounded-l-full bg-[var(--brand)]" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
