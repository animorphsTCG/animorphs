
import React from "react";
import { Card as CardType } from "@/types";
import { cn } from "@/lib/utils";

interface CardDisplayProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
}

const CardDisplay = ({
  card,
  onClick,
  className
}: CardDisplayProps) => {
  // Default image fallback if none is provided
  const imageUrl = card.image_url || "https://images.unsplash.com/photo-1569878698890-cf22a9a4ab4a?q=80&w=2069&auto=format&fit=crop";
  
  return (
    <div 
      className={cn("fantasy-card cursor-pointer transition-transform hover:scale-105", 
        className
      )}
      onClick={onClick}
    >
      <div className="fantasy-card-inner h-96 w-72 relative overflow-hidden rounded-lg border-2 border-fantasy-primary shadow-lg">
        <div className="h-full w-full">
          <img 
            src={imageUrl} 
            alt={card.nft_name || `Card #${card.card_number}`} 
            className="w-full h-full rounded-lg object-cover" 
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h3 className="text-lg font-bold text-white truncate">
              {card.nft_name || `Card #${card.card_number}`}
            </h3>
            {card.animorph_type && (
              <span className="text-sm text-fantasy-accent">
                {card.animorph_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
