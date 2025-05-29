
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getElementColor, getCardImageUrl, getCardImageFallback, AnimorphCard } from "@/lib/api";
import { useState } from "react";

interface CardDisplayProps {
  card: AnimorphCard;
  isSelected?: boolean;
  onClick?: () => void;
  showQuantity?: boolean;
  quantity?: number;
  battleMode?: boolean;
  onStatSelect?: (stat: string, value: number) => void;
  selectedStat?: string;
}

export const CardDisplay = ({ 
  card, 
  isSelected, 
  onClick, 
  showQuantity, 
  quantity,
  battleMode = false,
  onStatSelect,
  selectedStat
}: CardDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const elementColorClass = getElementColor(card.animorph_type);

  const handleStatClick = (stat: string, value: number) => {
    if (battleMode && onStatSelect) {
      onStatSelect(stat, value);
    }
  };

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : 'hover:shadow-md'
      } bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600`}
      onClick={onClick}
    >
      {showQuantity && quantity && quantity > 1 && (
        <Badge className="absolute top-2 right-2 z-10 bg-blue-600">
          {quantity}
        </Badge>
      )}
      
      <CardContent className="p-3">
        {/* Card Image */}
        <div className="aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
          {!imageError ? (
            <img
              src={getCardImageUrl(card)}
              alt={card.nft_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
              <div className={`w-16 h-16 rounded-full ${elementColorClass.split(' ')[1]} mb-2 flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">
                  {card.animorph_type[0]}
                </span>
              </div>
              <p className="text-xs text-center">Card #{card.token_id}</p>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm truncate">{card.display_name}</h3>
            <Badge className={elementColorClass}>
              {card.animorph_type}
            </Badge>
          </div>

          {/* Stats Display */}
          {battleMode ? (
            // Battle Mode: Selectable Stats
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={selectedStat === 'power' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick('power', card.power_rating);
                }}
              >
                Power: {card.power_rating}
              </Button>
              <Button
                variant={selectedStat === 'health' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick('health', card.health);
                }}
              >
                Health: {card.health}
              </Button>
              <Button
                variant={selectedStat === 'attack' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick('attack', card.attack);
                }}
              >
                Attack: {card.attack}
              </Button>
              <Button
                variant={selectedStat === 'sats' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick('sats', card.sats);
                }}
              >
                SATS: {card.sats}
              </Button>
              <Button
                variant={selectedStat === 'size' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs col-span-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick('size', card.size);
                }}
              >
                Size: {card.size}
              </Button>
            </div>
          ) : (
            // Collection Mode: Display Stats
            <>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Power:</span>
                  <span className="text-red-400 font-semibold">{card.power_rating}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Health:</span>
                  <span className="text-green-400 font-semibold">{card.health}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Attack:</span>
                  <span className="text-orange-400 font-semibold">{card.attack}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Size:</span>
                  <span className="text-blue-400 font-semibold">{card.size}</span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                  SATS: {card.sats}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Card grid component for displaying multiple cards
interface CardGridProps {
  cards: AnimorphCard[];
  selectedCards?: number[];
  onCardSelect?: (tokenId: number) => void;
  maxSelection?: number;
  showQuantity?: boolean;
  quantities?: { [tokenId: number]: number };
  emptyMessage?: string;
  battleMode?: boolean;
  onStatSelect?: (card: AnimorphCard, stat: string, value: number) => void;
  selectedStat?: string;
}

export const CardGrid = ({ 
  cards, 
  selectedCards = [], 
  onCardSelect, 
  maxSelection, 
  showQuantity = false,
  quantities = {},
  emptyMessage = "No cards available",
  battleMode = false,
  onStatSelect,
  selectedStat
}: CardGridProps) => {
  const handleCardClick = (tokenId: number) => {
    if (!onCardSelect) return;
    
    if (selectedCards.includes(tokenId)) {
      onCardSelect(tokenId);
    } else if (!maxSelection || selectedCards.length < maxSelection) {
      onCardSelect(tokenId);
    }
  };

  const handleStatSelect = (card: AnimorphCard, stat: string, value: number) => {
    if (onStatSelect) {
      onStatSelect(card, stat, value);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          <span className="text-4xl">🃏</span>
        </div>
        <p className="text-lg">{emptyMessage}</p>
        <p className="text-sm text-gray-500 mt-2">
          Connect your wallet or purchase a deck to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <CardDisplay
          key={card.token_id}
          card={card}
          isSelected={selectedCards.includes(card.token_id)}
          onClick={() => handleCardClick(card.token_id)}
          showQuantity={showQuantity}
          quantity={quantities[card.token_id]}
          battleMode={battleMode}
          onStatSelect={(stat, value) => handleStatSelect(card, stat, value)}
          selectedStat={selectedStat}
        />
      ))}
    </div>
  );
};
