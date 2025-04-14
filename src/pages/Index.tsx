
import React, { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import CardDisplay from "@/components/CardDisplay";
import { AnimorphCard } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { fetchCardById } from "@/lib/db";
import { Loader2, Gamepad2 } from "lucide-react";

const Index = () => {
  const [featuredCards, setFeaturedCards] = useState<AnimorphCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedCards = async () => {
      try {
        // Fetch specific card IDs to showcase all five elemental types
        const cardIds = [1, 6, 11, 16, 21];
        const cardPromises = cardIds.map(id => fetchCardById(id));
        
        const loadedCards = await Promise.all(cardPromises);
        // Filter out any null results (in case a card wasn't found)
        setFeaturedCards(loadedCards.filter(card => card !== null) as AnimorphCard[]);
      } catch (error) {
        console.error("Error loading featured cards:", error);
        // Don't show an error toast on the homepage for better UX
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedCards();
  }, []);

  return (
    <main>
      <Hero />
      <FeatureSection />
      
      {/* Featured Cards Section */}
      <section className="py-24 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-fantasy">
              Featured <span className="text-fantasy-accent">Battle Cards</span>
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Discover powerful Animorph cards to add to your battle deck. Each card represents one of the five elemental types available in the game.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
              <p>Loading featured cards...</p>
            </div>
          ) : featuredCards.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8">
              {featuredCards.map((card) => (
                <CardDisplay key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400 mb-6">Discover amazing battle cards in our gallery!</p>
              <Link to="/card-gallery">
                <Button className="fantasy-button text-lg px-8 py-3">
                  Browse Card Gallery
                </Button>
              </Link>
            </div>
          )}
          
          {featuredCards.length > 0 && (
            <div className="text-center mt-16">
              <Link to="/card-gallery">
                <Button className="fantasy-button text-lg px-8 py-3">
                  View All Cards
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Demo Battle Section - New addition */}
      <section className="py-16 bg-gradient-to-r from-fantasy-primary/30 to-fantasy-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 font-fantasy">
            Try the <span className="text-fantasy-accent">Demo Battle</span>
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
            No registration required! Experience the excitement of Animorph battles with our free demo mode.
            Challenge the AI and learn the game mechanics before creating your account.
          </p>
          <Link to="/visitor-demo-battle">
            <Button className="bg-fantasy-accent hover:bg-fantasy-accent/80 text-black font-bold text-lg px-10 py-6">
              <Gamepad2 className="mr-2 h-6 w-6" />
              Start Demo Battle Now!
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-b from-black/80 to-fantasy-primary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-fantasy">
            Ready to <span className="text-fantasy-accent">Join the Battle?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Create your account now and start collecting powerful Animorph cards. Challenge other players and climb the ranks!
          </p>
          <Link to="/register">
            <Button className="fantasy-button text-lg px-10 py-6">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Index;
