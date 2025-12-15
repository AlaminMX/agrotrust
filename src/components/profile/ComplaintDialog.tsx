import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ComplaintDialogProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplaintFiled: () => void;
}

const COMPLAINT_TYPES = [
  { value: 'quality', label: 'Product Quality Issue' },
  { value: 'missing', label: 'Missing Items' },
  { value: 'damaged', label: 'Damaged Products' },
  { value: 'wrong_item', label: 'Wrong Items Delivered' },
  { value: 'late_delivery', label: 'Delivery Issues' },
  { value: 'other', label: 'Other Issue' },
];

export function ComplaintDialog({ 
  orderId, 
  orderNumber, 
  open, 
  onOpenChange, 
  onComplaintFiled 
}: ComplaintDialogProps) {
  const { toast } = useToast();
  const [complaintType, setComplaintType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!complaintType || !description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a complaint type and describe your issue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update order status to disputed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'disputed' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add tracking event
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status: 'disputed',
          description: `Complaint filed: ${COMPLAINT_TYPES.find(t => t.value === complaintType)?.label} - ${description}`,
        });

      if (trackingError) throw trackingError;

      toast({
        title: 'Complaint Filed',
        description: 'Our team will review your complaint and get back to you within 24-48 hours.',
      });

      setComplaintType('');
      setDescription('');
      onComplaintFiled();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to File Complaint',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            File a Complaint
          </DialogTitle>
          <DialogDescription>
            Order #{orderNumber} - Tell us about the issue you experienced
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="complaint-type">Type of Issue</Label>
            <Select value={complaintType} onValueChange={setComplaintType}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe the Issue</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about your complaint. Include any relevant information that will help us resolve this quickly."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what went wrong and what resolution you're expecting.
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Your order will be marked as disputed</li>
              <li>• Escrow payment will be held until resolved</li>
              <li>• Our team will contact you within 24-48 hours</li>
              <li>• We'll work to find a fair resolution</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'File Complaint'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
