"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UploadsOverTimePoint } from "@/lib/server/analytics/service";

const axisStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? "hsl(var(--primary))" }}
            aria-hidden="true"
          />
          {entry.name === "uploads" ? "Documents" : "Questions"}:{" "}
          <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data }: { data: UploadsOverTimePoint[] }) {
  const weekly = data.filter((_, index) => index % 7 === 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="uploadsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area
          type="monotone"
          dataKey="uploads"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#uploadsFill)"
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function QuestionsChart({ data }: { data: UploadsOverTimePoint[] }) {
  const weekly = data.filter((_, index) => index % 3 === 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.5)" }} />
        <Bar
          dataKey="questions"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={26}
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
