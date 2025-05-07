
import React from 'react';
import { Button } from "@/components/ui/button";

interface SongCollectionProps {
  selectedSongs: string[];
  subscription: {
    subscription_type: 'monthly' | 'yearly';
    end_date: string;
  } | null;
  hasSubscription?: boolean;
  onBrowseSongs: () => void;
  onUpgrade: () => void;
}

const SongCollection: React.FC<SongCollectionProps> = ({
  selectedSongs,
  subscription,
  hasSubscription = false,
  onBrowseSongs,
  onUpgrade
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Song Collection</h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={onBrowseSongs}
            disabled={selectedSongs.length >= 5 && !hasSubscription}
          >
            Browse Songs
          </Button>
          {!hasSubscription && (
            <Button
              variant="default"
              onClick={onUpgrade}
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {!hasSubscription && selectedSongs.length < 5 && (
        <p className="text-sm text-muted-foreground">
          Select up to 5 free songs for your collection
        </p>
      )}

      {hasSubscription && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-lg">
          <p className="text-sm text-emerald-400">
            {subscription ? 
              `${subscription.subscription_type === 'monthly' ? 'Monthly' : 'Yearly'} subscription active until ${new Date(subscription.end_date).toLocaleDateString()}` : 
              "Music subscription active"
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You have access to all songs
          </p>
        </div>
      )}
      
      {subscription && !hasSubscription && (
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">
            {subscription.subscription_type === 'monthly' ? 'Monthly' : 'Yearly'} subscription
          </p>
          <p className="text-xs text-muted-foreground">
            Expires: {new Date(subscription.end_date).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default SongCollection;
