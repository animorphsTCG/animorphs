
import React from 'react';
import { Button } from "@/components/ui/button";

interface SongCollectionProps {
  selectedSongs: string[];
  subscription: {
    subscription_type: 'monthly' | 'yearly';
    end_date: string;
  } | null;
  onBrowseSongs: () => void;
  onUpgrade: () => void;
}

const SongCollection: React.FC<SongCollectionProps> = ({
  selectedSongs,
  subscription,
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
            disabled={selectedSongs.length >= 5 && !subscription}
          >
            Browse Songs
          </Button>
          {!subscription && (
            <Button
              variant="default"
              onClick={onUpgrade}
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {!subscription && selectedSongs.length < 5 && (
        <p className="text-sm text-muted-foreground">
          Select up to 5 free songs for your collection
        </p>
      )}

      {subscription && (
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">
            {subscription.subscription_type === 'monthly' ? 'Monthly' : 'Yearly'} subscription active
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

