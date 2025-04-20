
import React from "react";
import { AnimorphCard } from "@/types";
import { cn } from "@/lib/utils";

export interface BattleCardDisplayProps {
  card: AnimorphCard;
  isRevealed?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  
  // Legacy props for backward compatibility
  isFlipped?: boolean;
  roundWins?: number;
  playerName?: string;
  cardCount?: number;
  onStatSelect?: (stat: string) => void;
  selectedStat?: string | null;
}

const BattleCardDisplay = ({
  card,
  isRevealed = false,
  isActive = false,
  onClick,
  className,
  
  // Legacy props
  isFlipped,
  roundWins,
  playerName,
  cardCount,
  onStatSelect,
  selectedStat
}: BattleCardDisplayProps) => {
  // Use isFlipped as fallback for isRevealed for backward compatibility
  const shouldRevealCard = isRevealed || isFlipped;
  
  // Only use real data, no fallbacks
  const imageUrl = card.image_url;
  const cardName = card.nft_name;
  
  // Stats for the stat selector
  const stats = ['power', 'health', 'attack', 'sats', 'size'];

  return (
    <div 
      className={cn(
        "fantasy-card cursor-pointer transition-transform hover:scale-105", 
        isActive && "border-2 border-green-500",
        className
      )} 
      onClick={onClick}
    >
      {/* Show player info if using legacy props */}
      {playerName && (
        <div className="text-center mb-1 font-fantasy">
          <div className="text-lg">{playerName}</div>
          {roundWins !== undefined && (
            <div className="bg-fantasy-accent/20 px-3 py-1 rounded-full text-sm font-bold">
              Wins: {roundWins}
              {cardCount !== undefined && <span className="ml-2">Cards: {cardCount}</span>}
            </div>
          )}
        </div>
      )}
      
      <div className="fantasy-card-inner h-96 w-72 relative overflow-hidden rounded-lg border-2 border-fantasy-primary shadow-lg">
        <div className="h-full w-full">
          {shouldRevealCard ? (
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
      
      {/* Stat selector for legacy components */}
      {isActive && onStatSelect && (
        <div className="mt-2 flex justify-center gap-2 flex-wrap">
          {stats.map(stat => (
            <button 
              key={stat} 
              disabled={!!selectedStat} 
              onClick={() => onStatSelect(stat)} 
              className="font-bold rounded-lg px-2 py-1 bg-fuchsia-900 hover:bg-fuchsia-800 text-purple-400"
            >
              {stat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleCardDisplay;
