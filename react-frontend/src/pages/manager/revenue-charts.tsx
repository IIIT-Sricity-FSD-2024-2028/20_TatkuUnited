import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarDatum {
  name: string;
  value: number;
}

// One horizontal bar per row, with the name on the left. Used for both the
// booking-status and the category charts, so the two look the same.
export default function HorizontalBars({
  data,
  formatValue,
  tooltipLabel,
}: {
  data: BarDatum[];
  formatValue: (value: number) => string;
  tooltipLabel: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // about 40px per bar, so a long list doesn't squash its bars
  const height = Math.max(120, data.length * 40 + 24);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => formatValue(v)}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={96}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => {
              const n = Number(value);
              const share = total ? Math.round((n / total) * 100) : 0;
              return [`${formatValue(n)} (${share}%)`, tooltipLabel];
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--primary)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
