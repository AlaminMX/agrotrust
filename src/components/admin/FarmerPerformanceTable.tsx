import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatNaira } from '@/lib/format';

interface FarmerPerformanceTableProps {
  data: {
    id: string;
    farmName: string;
    state: string;
    orders: number;
    revenue: number;
    rating: number;
    products: number;
  }[];
}

export function FarmerPerformanceTable({ data }: FarmerPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No farmer data available for this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Farm Name</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-right">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 15).map((farmer, index) => (
            <TableRow key={farmer.id}>
              <TableCell>
                {index < 3 ? (
                  <Badge variant={index === 0 ? 'default' : 'secondary'} className={
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    'bg-amber-600'
                  }>
                    #{index + 1}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">#{index + 1}</span>
                )}
              </TableCell>
              <TableCell className="font-medium">{farmer.farmName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{farmer.state}</Badge>
              </TableCell>
              <TableCell className="text-right">{farmer.orders}</TableCell>
              <TableCell className="text-right font-medium">{formatNaira(farmer.revenue)}</TableCell>
              <TableCell className="text-right">{farmer.products}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{farmer.rating.toFixed(1)}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
