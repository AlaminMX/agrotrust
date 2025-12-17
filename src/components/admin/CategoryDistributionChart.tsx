import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatNaira } from '@/lib/format';

interface CategoryDistributionChartProps {
  data: { category: string; revenue: number; count: number }[];
}

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // green
  'hsl(25, 95%, 53%)', // orange
  'hsl(262, 83%, 58%)', // purple
  'hsl(199, 89%, 48%)', // blue
  'hsl(350, 89%, 60%)', // red
  'hsl(45, 93%, 47%)', // yellow
];

const CATEGORY_LABELS: Record<string, string> = {
  vegetables: 'Vegetables 🥬',
  fruits: 'Fruits 🍎',
  grains: 'Grains 🌾',
  tubers: 'Tubers 🥔',
  poultry: 'Poultry 🐔',
  dairy: 'Dairy 🥛',
  herbs: 'Herbs 🌿',
  other: 'Other',
};

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  if (data.length === 0 || data.every(d => d.revenue === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No category data available for this period
      </div>
    );
  }

  const chartData = data
    .filter(d => d.revenue > 0)
    .map(item => ({
      ...item,
      displayName: CATEGORY_LABELS[item.category] || item.category,
    }));

  return (
    <div className="h-full flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={2}
              dataKey="revenue"
              nameKey="displayName"
              label={({ displayName, percent }) => 
                percent > 0.05 ? `${displayName.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.displayName}</p>
                      <p className="text-primary">{formatNaira(data.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{data.count} products</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-[180px] flex flex-col justify-center gap-2">
        {chartData.map((item, index) => (
          <div key={item.category} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
            />
            <span className="text-sm truncate">{item.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
