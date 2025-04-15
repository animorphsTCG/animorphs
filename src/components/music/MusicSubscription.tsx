
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface MusicSubscriptionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
}

const MusicSubscription: React.FC<MusicSubscriptionProps> = ({
  open,
  onOpenChange,
  onSubscribe,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Music Subscription Plans</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 mt-4">
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-lg">Monthly Plan</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Full access to all songs
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Unlimited song selection
              </li>
            </ul>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">R1 ZAR</span>
              <Button onClick={() => onSubscribe('monthly')}>
                Subscribe Monthly
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h3 className="font-medium text-lg">Yearly Plan</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Full access to all songs
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Unlimited song selection
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Save 16% compared to monthly
              </li>
            </ul>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">R12 ZAR</span>
              <Button onClick={() => onSubscribe('yearly')} variant="default">
                Subscribe Yearly
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicSubscription;
