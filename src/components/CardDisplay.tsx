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
  // Only use real data, no fallbacks
  const imageUrl = card.image_url;
  const cardName = card.nft_name;
  return <div className={cn("fantasy-card cursor-pointer transition-transform hover:scale-105", className)} onClick={onClick}>
      <div className="fantasy-card-inner h-96 w-72 relative overflow-hidden rounded-lg border-2 border-fantasy-primary shadow-lg">
        <div className="h-full w-full">
          <img src={imageUrl} alt={cardName || `Card #${card.card_number}`} className="w-full h-full rounded-lg object-cover" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            
            
            <div className="grid grid-cols-3 gap-1 mt-1">
              
              
              
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default CardDisplay;