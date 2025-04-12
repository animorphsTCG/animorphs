
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AnimorphCard } from "@/types";

interface CardSelectionScreenProps {
  isLoading: boolean;
  allCards: AnimorphCard[];
  selectedCardIds: number[];
  toggleCardSelection: (id: number) => void;
  startBattle: () => void;
}

const CardSelectionScreen: React.FC<CardSelectionScreenProps> = ({
  isLoading,
  allCards,
  selectedCardIds,
  toggleCardSelection,
  startBattle,
}) => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">1v1 Battle</CardTitle>
          <CardDescription>Select 10 cards for your battle deck</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
              <p>Loading cards...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-medium">
                  Selected: {selectedCardIds.length} / 10 cards
                </h3>
                <Button 
                  className="fantasy-button"
                  onClick={startBattle}
                  disabled={selectedCardIds.length !== 10}
                >
                  Start Battle
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {allCards.map(card => (
                  <div 
                    key={card.id}
                    className={`cursor-pointer transition-all ${
                      selectedCardIds.includes(card.id) 
                        ? "scale-105 ring-2 ring-fantasy-accent" 
                        : "opacity-90 hover:opacity-100"
                    }`}
                    onClick={() => toggleCardSelection(card.id)}
                  >
                    <img 
                      src={card.image_url} 
                      alt={card.nft_name} 
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <div className="mt-1 text-xs text-center">
                      {card.nft_name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardSelectionScreen;
