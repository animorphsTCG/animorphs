
import React from "react";
import { Card as CardType } from "@/types";

interface CardDisplayProps {
  card: CardType;
  onClick?: () => void;
}

const CardDisplay = ({
  card,
  onClick
}: CardDisplayProps) => {
  // Placeholder image if none is provided
  const imageUrl = card.image_url || "https://images.unsplash.com/photo-1569878698890-cf22a9a4ab4a?q=80&w=2069&auto=format&fit=crop";
  
  return (
    <div className="fantasy-card cursor-pointer" onClick={onClick}>
      <div className="fantasy-card-inner h-96 w-72">
        <div className="h-full w-full">
          <img 
            src={imageUrl} 
            alt={card.nft_name || `Card #${card.card_number}`}
            className="w-full h-full rounded-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
