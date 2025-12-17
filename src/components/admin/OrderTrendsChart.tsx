import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OrderTrendsChartProps {
  data: { date: string; revenue: number; orders: number }[];
  statusData: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  paid: '#60a5fa',
  processing: '#a78bfa',
  dispatched: '#34d399',
  out_for_delivery: '#2dd4bf',
  delivered: '#22c55e',
  confirmed: '#16a34a',
  disputed: '#ef4444',
};

export function OrderTrendsChart({ data, statusData }: OrderTrendsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No order data available for this period
      </div>
    );
  }

  return (
    <div className="h-full flex gap-4">
      {/* Line Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-primary">{payload[0].value} orders</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart for Status Distribution */}
      <div className="w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
            >
              {statusData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || '#94a3b8'} 
                />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-sm capitalize">{data.status.replace('_', ' ')}</p>
                      <p className="font-medium">{data.count} orders</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-1 justify-center">
          {statusData.slice(0, 4).map((item) => (
            <div key={item.status} className="flex items-center gap-1 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
              />
              <span className="capitalize">{item.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
