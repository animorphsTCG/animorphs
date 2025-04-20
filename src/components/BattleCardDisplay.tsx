
import React from "react";
import { AnimorphCard } from "@/types";
import { cn } from "@/lib/utils";

export interface BattleCardDisplayProps {
  card: AnimorphCard;
  isRevealed?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const BattleCardDisplay = ({
  card,
  isRevealed = false,
  isActive = false,
  onClick,
  className
}: BattleCardDisplayProps) => {
  // Only use real data, no fallbacks
  const imageUrl = card.image_url;
  const cardName = card.nft_name;

  return (
    <div 
      className={cn(
        "fantasy-card cursor-pointer transition-transform hover:scale-105", 
        isActive && "border-2 border-green-500",
        className
      )} 
      onClick={onClick}
    >
      <div className="fantasy-card-inner h-96 w-72 relative overflow-hidden rounded-lg border-2 border-fantasy-primary shadow-lg">
        <div className="h-full w-full">
          {isRevealed ? (
            <img 
              src={imageUrl} 
              alt={cardName || `Card #${card.card_number}`} 
              className="w-full h-full rounded-lg object-cover" 
              loading="lazy" 
            />
          ) : (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Card Hidden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleCardDisplay;
