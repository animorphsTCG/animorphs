
import React from "react";
import { AnimorphCard } from "@/types";
import { cn } from "@/lib/utils";

interface CardDisplayProps {
  card: AnimorphCard;
  onClick?: () => void;
  className?: string;
}

const CardDisplay = ({
  card,
  onClick,
  className
}: CardDisplayProps) => {
  // Only use real data, with fallbacks for nullable fields
  const imageUrl = card.image_url || '';
  const cardName = card.nft_name || `Card #${card.card_number || 0}`;

  return (
    <div 
      className={cn("fantasy-card cursor-pointer transition-transform hover:scale-105", className)} 
      onClick={onClick}
    >
      <div className="fantasy-card-inner h-96 w-72 relative overflow-hidden rounded-lg border-2 border-fantasy-primary shadow-lg">
        <div className="h-full w-full">
          <img 
            src={imageUrl} 
            alt={cardName} 
            className="w-full h-full rounded-lg object-cover" 
            loading="lazy" 
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }} 
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h3 className="text-white font-bold truncate">{cardName}</h3>
            
            <div className="grid grid-cols-3 gap-1 mt-1">
              <div className="bg-black/50 text-white text-xs p-1 rounded text-center">
                Power: {card.power || 0}
              </div>
              <div className="bg-black/50 text-white text-xs p-1 rounded text-center">
                ATK: {card.attack || 0}
              </div>
              <div className="bg-black/50 text-white text-xs p-1 rounded text-center">
                HP: {card.health || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
