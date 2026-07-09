"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function TrafficChart({ data }: { data: { date: string; clicks: number; impressions: number }[] }) {
  return (
    <div className="card h-72">
      <p className="kpi-label mb-3">Clicks and impressions</p>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid stroke="#20305a" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip contentStyle={{ background: "#131c33", border: "1px solid #20305a", borderRadius: 8 }} />
          <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="impressions" stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
