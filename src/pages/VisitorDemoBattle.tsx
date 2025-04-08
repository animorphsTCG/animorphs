
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import CardDisplay from "@/components/CardDisplay";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards } from "@/lib/db";

const statsOptions = ['power', 'health', 'attack', 'sats', 'size'];

const VisitorDemoBattle = () => {
  const [visitorCard, setVisitorCard] = useState<AnimorphCard | null>(null);
  const [aiCard, setAiCard] = useState<AnimorphCard | null>(null);
  const [aiStat, setAiStat] = useState<string | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCards, setAvailableCards] = useState<AnimorphCard[]>([]);
  const [selectedVisitorCard, setSelectedVisitorCard] = useState<number | null>(null);
  
  const navigate = useNavigate();

  // Fetch a selection of cards for the demo battle
  useEffect(() => {
    const getCards = async () => {
      try {
        setIsLoading(true);
        // Get 25 cards for the demo
        const cards = await fetchAnimorphCards(25);
        
        if (cards && cards.length > 0) {
          setAvailableCards(cards);
          // Select a random card for the AI
          const randomIndex = Math.floor(Math.random() * cards.length);
          setAiCard(cards[randomIndex]);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch cards. Please try again.",
            variant: "destructive",
          });
        }
        
      } catch (error) {
        console.error("Error fetching cards:", error);
        toast({
          title: "Error",
          description: "Failed to fetch cards. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getCards();
  }, []);

  const handleSelectCard = (card: AnimorphCard) => {
    setVisitorCard(card);
    setSelectedVisitorCard(card.id);
  };

  const handleBattle = () => {
    if (!visitorCard) {
      toast({
        title: "Select a Card",
        description: "Please select a card before battling.",
        variant: "destructive",
      });
      return;
    }

    // Start AI thinking delay
    setIsAiThinking(true);
    setResult(null);
    setAiStat(null);

    const delay = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000; // between 5 and 7 seconds
    setTimeout(() => {
      const randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
      setAiStat(randomStat);
      setIsAiThinking(false);

      if (visitorCard && aiCard) {
        // Use the randomly chosen stat from both cards
        const userValue = visitorCard[randomStat as keyof typeof visitorCard] as number;
        const aiValue = aiCard[randomStat as keyof typeof aiCard] as number;

        if (userValue > aiValue) {
          setResult('win');
          setIsPopupOpen(true);
        } else if (userValue < aiValue) {
          setResult('lose');
        } else {
          setResult('tie');
        }
      }
    }, delay);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
        <p className="ml-2 text-lg">Loading cards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Visitor Demo Battle</CardTitle>
        </CardHeader>
        
        <CardContent>
          {!visitorCard ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Your Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {availableCards.slice(0, 10).map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className="cursor-pointer transition-all transform hover:scale-105"
                  >
                    <CardDisplay card={card} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-center">Your Card</h3>
                  <CardDisplay card={visitorCard} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-center">AI's Card</h3>
                  {aiCard && <CardDisplay card={aiCard} />}
                  {aiStat ? (
                    <div className="text-center bg-fantasy-accent/20 p-3 rounded-lg">
                      <p className="text-lg">Comparing <span className="font-bold uppercase">{aiStat}</span></p>
                    </div>
                  ) : (
                    <div className="text-center bg-gray-800/50 p-3 rounded-lg">
                      <p>{isAiThinking ? 'AI is thinking...' : 'Awaiting battle'}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  className="fantasy-button text-lg py-6 px-12" 
                  onClick={handleBattle} 
                  disabled={isAiThinking}
                >
                  {isAiThinking ? 'AI is Thinking...' : 'Battle!'}
                </Button>
              </div>
              
              {result && visitorCard && aiCard && aiStat && (
                <div className="bg-gray-800/70 p-4 rounded-lg text-center">
                  {result === 'win' && (
                    <p className="text-lg">
                      <span className="text-green-500 font-bold">You won!</span> Your {aiStat.toUpperCase()}: {visitorCard[aiStat as keyof typeof visitorCard]} vs. AI's {aiStat.toUpperCase()}: {aiCard[aiStat as keyof typeof aiCard]}
                    </p>
                  )}
                  {result === 'lose' && (
                    <p className="text-lg">
                      <span className="text-red-500 font-bold">You lost.</span> Your {aiStat.toUpperCase()}: {visitorCard[aiStat as keyof typeof visitorCard]} vs. AI's {aiStat.toUpperCase()}: {aiCard[aiStat as keyof typeof aiCard]}
                    </p>
                  )}
                  {result === 'tie' && (
                    <p className="text-lg">
                      <span className="text-yellow-500 font-bold">It's a tie!</span> Both cards have {aiStat.toUpperCase()}: {visitorCard[aiStat as keyof typeof visitorCard]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="bg-gray-900 border-2 border-fantasy-accent p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold text-fantasy-accent mb-4">Congratulations!</h3>
            <p className="mb-6">
              Well Played! You may have what it takes to reach the top of the Leader Board.
              Register now and use <strong className="text-fantasy-secondary">WonAgainstAi</strong> in the VIP Code box when registering to claim
              1 of 50 free 200‑card decks!!! Users must be 18 or older and complete Future KYC Verification to unlock
              withdrawal of earnings!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPopupOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button 
                className="fantasy-button w-full sm:w-auto"
                onClick={() => navigate("/register?vip=WonAgainstAi")}
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDemoBattle;
