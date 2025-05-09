
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnimorphCards } from '@/lib/db';
import { AnimorphCard } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/modules/auth/context/AuthContext';

const DeckBuilder = () => {
  const { user } = useAuth();
  const [allCards, setAllCards] = useState<AnimorphCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<AnimorphCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await fetchAnimorphCards(100);
        setAllCards(cards);
      } catch (error) {
        console.error("Error loading cards:", error);
        toast({
          title: "Error",
          description: "Failed to load cards. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCards();
  }, []);

  const toggleCardSelection = (card: AnimorphCard) => {
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      if (selectedCards.length < 10) {
        setSelectedCards([...selectedCards, card]);
      } else {
        toast({
          title: "Selection limit reached",
          description: "You can only select 10 cards for your deck.",
        });
      }
    }
  };

  const saveDeck = async () => {
    if (selectedCards.length !== 10) {
      toast({
        title: "Invalid deck",
        description: "Your deck must contain exactly 10 cards.",
        variant: "destructive",
      });
      return;
    }

    // Future implementation for saving deck to database
    toast({
      title: "Deck saved",
      description: "Your deck has been saved successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fantasy-accent mx-auto mb-4"></div>
          <p className="text-lg">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-fantasy-accent">Deck Builder</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card className="bg-black/40 border border-fantasy-primary/30">
            <CardHeader>
              <CardTitle>Available Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allCards
                  .filter(card => !selectedCards.some(c => c.id === card.id))
                  .map(card => (
                    <div
                      key={card.id}
                      className="border border-fantasy-primary/30 rounded p-3 cursor-pointer hover:bg-black/60 transition-colors"
                      onClick={() => toggleCardSelection(card)}
                    >
                      <h3 className="font-bold">{card.nft_name}</h3>
                      <p className="text-sm text-gray-400">Type: {card.animorph_type}</p>
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <div className="text-center">
                          <span className="text-xs block text-gray-400">ATK</span>
                          <span className="font-medium">{card.attack}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs block text-gray-400">HP</span>
                          <span className="font-medium">{card.health}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs block text-gray-400">PWR</span>
                          <span className="font-medium">{card.power}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="order-1 lg:order-2">
          <Card className="bg-black/40 border border-fantasy-primary/30 sticky top-4">
            <CardHeader>
              <CardTitle>Your Deck ({selectedCards.length}/10)</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCards.length > 0 ? (
                <div className="space-y-2">
                  {selectedCards.map(card => (
                    <div
                      key={card.id}
                      className="border border-fantasy-accent/30 bg-black/60 rounded p-2 cursor-pointer hover:bg-black/40 transition-colors"
                      onClick={() => toggleCardSelection(card)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{card.nft_name}</span>
                        <span className="text-xs">{card.animorph_type}</span>
                      </div>
                      <div className="text-xs text-gray-400 flex justify-between mt-1">
                        <span>ATK: {card.attack}</span>
                        <span>HP: {card.health}</span>
                        <span>PWR: {card.power}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No cards selected yet.</p>
              )}
              
              <button
                className="w-full mt-4 py-2 bg-fantasy-accent text-black rounded font-medium hover:bg-fantasy-accent/80 transition-colors"
                onClick={saveDeck}
                disabled={selectedCards.length !== 10}
              >
                Save Deck
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;
