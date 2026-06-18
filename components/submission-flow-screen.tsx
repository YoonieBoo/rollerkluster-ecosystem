'use client';

import { Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type SubmissionFlowScreenProps = {
  open: boolean;
  status: 'processing' | 'success';
  onClose: () => void;
};

export function SubmissionFlowScreen({ open, status, onClose }: SubmissionFlowScreenProps) {
  const isSuccess = status === 'success';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && isSuccess) onClose();
    }}>
      <DialogContent className="max-w-[420px] gap-0 rounded-[28px] border-0 px-6 pb-7 pt-5 text-center shadow-2xl sm:px-8" showCloseButton={false}>
        <div className="mx-auto mb-9 h-1.5 w-12 rounded-full bg-muted" />
        <div className="mx-auto flex min-h-[170px] flex-col items-center justify-center">
          {isSuccess ? (
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_10px_28px_rgba(16,185,129,0.28)]">
              <Check className="size-10 stroke-[3]" />
            </div>
          ) : (
            <div className="relative flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
              <Send className="relative size-10 -rotate-12" />
            </div>
          )}
        </div>
        <DialogTitle className="text-xl font-semibold tracking-normal">
          {isSuccess ? 'Submission sent' : 'Submitting for review...'}
        </DialogTitle>
        <DialogDescription className="mx-auto mt-3 max-w-[280px] text-sm leading-6">
          {isSuccess
            ? 'Your content is now in the review queue. We will update your status after it is checked.'
            : 'We are adding your content link to the campaign review queue.'}
        </DialogDescription>
        {isSuccess && (
          <Button className="mx-auto mt-7 h-11 rounded-full bg-primary px-8 text-white hover:bg-primary/90" onClick={onClose}>
            Done
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
