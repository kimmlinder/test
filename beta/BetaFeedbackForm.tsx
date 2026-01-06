import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Bug, Lightbulb, Heart, HelpCircle, Star, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BetaFeedbackFormProps {
  featureName?: string;
  onSuccess?: () => void;
}

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-400' },
  { value: 'praise', label: 'Praise', icon: Heart, color: 'text-pink-400' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-muted-foreground' },
];

export function BetaFeedbackForm({ featureName = 'General', onSuccess }: BetaFeedbackFormProps) {
  const { user } = useAuth();
  const [type, setType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !type || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user.id,
        feature_name: featureName,
        feedback_type: type,
        message: message.trim(),
        rating: rating || null,
      });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setType('');
      setMessage('');
      setRating(0);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Submit Feedback</CardTitle>
            <CardDescription>Help us improve beta features</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Feedback Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    <div className="flex items-center gap-2">
                      <ft.icon className={cn("h-4 w-4", ft.color)} />
                      {ft.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Your Message *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback in detail..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Rating (optional)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !type || !message.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}