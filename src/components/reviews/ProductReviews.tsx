import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      // Fetch reviews - profiles join might fail due to RLS, so we handle it gracefully
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Set reviews without profile data (for privacy)
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No reviews yet. Be the first to review this product!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customer Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Verified Buyer</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'PP')}
                  </p>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground ml-10">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
