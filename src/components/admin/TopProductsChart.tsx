import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira } from '@/lib/format';

interface TopProductsChartProps {
  data: { name: string; revenue: number; quantity: number }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No product data available for this period
      </div>
    );
  }

  // Truncate product names for better display
  const chartData = data.map(item => ({
    ...item,
    displayName: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
        <XAxis 
          type="number"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
        />
        <YAxis 
          type="category"
          dataKey="displayName"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-primary">{formatNaira(data.revenue)}</p>
                  <p className="text-sm text-muted-foreground">{data.quantity} units sold</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey="revenue" 
          fill="hsl(var(--primary))" 
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
