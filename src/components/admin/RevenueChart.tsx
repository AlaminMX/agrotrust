import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira } from '@/lib/format';

interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No revenue data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
          className="text-muted-foreground"
        />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p className="text-primary">{formatNaira(payload[0].value as number)}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
