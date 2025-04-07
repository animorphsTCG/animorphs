
import React from "react";
import { Card as CardType } from "@/types";

interface CardDisplayProps {
  card: CardType;
  onClick?: () => void;
}

const CardDisplay = ({ card, onClick }: CardDisplayProps) => {
  // Placeholder image if none is provided
  const imageUrl = card.image_url || "https://images.unsplash.com/photo-1569878698890-cf22a9a4ab4a?q=80&w=2069&auto=format&fit=crop";
  
  return (
    <div 
      className="fantasy-card cursor-pointer" 
      onClick={onClick}
    >
      <div className="fantasy-card-inner h-96 w-72">
        <div className="p-1">
          <div className="h-52 overflow-hidden rounded-t-lg">
            <img 
              src={imageUrl} 
              alt={card.nft_name || `Card #${card.card_number}`} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-4 bg-gradient-to-b from-gray-900/95 to-black/95 h-44">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-fantasy-accent">
                {card.nft_name || `Animorph #${card.card_number}`}
              </h3>
              <span className="bg-fantasy-primary px-2 py-1 rounded-full text-xs font-bold text-white">
                #{card.card_number}
              </span>
            </div>
            
            {card.animorph_type && (
              <div className="mb-2">
                <span className="text-sm text-gray-300">Type: </span>
                <span className="text-fantasy-secondary font-bold">{card.animorph_type}</span>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              {card.power !== undefined && (
                <div className="bg-fantasy-primary/20 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Power</div>
                  <div className="font-bold text-white">{card.power}</div>
                </div>
              )}
              
              {card.health !== undefined && (
                <div className="bg-fantasy-success/20 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Health</div>
                  <div className="font-bold text-white">{card.health}</div>
                </div>
              )}
              
              {card.attack !== undefined && (
                <div className="bg-fantasy-danger/20 p-2 rounded text-center">
                  <div className="text-xs text-gray-400">Attack</div>
                  <div className="font-bold text-white">{card.attack}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
