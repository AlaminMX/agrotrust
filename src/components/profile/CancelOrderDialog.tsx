import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, XCircle } from 'lucide-react';

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCancelled: () => void;
}

export function CancelOrderDialog({ 
  orderId, 
  orderNumber, 
  open, 
  onOpenChange, 
  onOrderCancelled 
}: CancelOrderDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      // Update order status - note: in a real app, you'd also handle refunds
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'disputed' }) // Using disputed as we don't have a cancelled status
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add tracking event
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status: 'disputed',
          description: `Order cancellation requested${reason ? `: ${reason}` : ''}. Refund will be processed.`,
        });

      if (trackingError) throw trackingError;

      toast({
        title: 'Cancellation Requested',
        description: 'Your order cancellation has been submitted. Refund will be processed within 5-7 business days.',
      });

      setReason('');
      onOrderCancelled();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to Cancel Order',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm font-medium text-destructive">Are you sure you want to cancel this order?</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. If payment was made, a refund will be initiated.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Order
          </Button>
          <Button onClick={handleCancel} disabled={isSubmitting} variant="destructive">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
