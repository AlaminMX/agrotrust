import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  order_items: OrderItem[];
}

interface ReviewDialogProps {
  order: Order;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export function ReviewDialog({ order, onClose, onReviewSubmitted }: ReviewDialogProps) {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!selectedProduct || rating === 0) {
      toast.error('Please select a product and rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: selectedProduct.product_id,
          order_id: order.id,
          user_id: user?.id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast.success('Thank you for your review!');
      onReviewSubmitted();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product for this order');
      } else {
        toast.error('Failed to submit review');
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Your Purchase</DialogTitle>
          <DialogDescription>
            Share your experience with the products from order #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Select Product to Review</Label>
            <div className="grid gap-2">
              {order.order_items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    selectedProduct?.id === item.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium">{item.product_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">× {item.quantity}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          {selectedProduct && (
            <>
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience with this product..."
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmitReview}
              disabled={!selectedProduct || rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
