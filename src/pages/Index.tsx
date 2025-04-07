
import React from "react";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import CardDisplay from "@/components/CardDisplay";
import { Card } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  // Sample featured cards
  const featuredCards: Card[] = [
    {
      id: 1,
      card_number: 101,
      image_url: "https://images.unsplash.com/photo-1560707854-8c642b4f2106?q=80&w=1922&auto=format&fit=crop",
      nft_name: "Dragon Mage",
      animorph_type: "Mythical",
      power: 95,
      health: 120,
      attack: 85,
      sats: 120,
      size: 8
    },
    {
      id: 2,
      card_number: 102,
      image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Tech Warrior",
      animorph_type: "Cyber",
      power: 80,
      health: 90,
      attack: 110,
      sats: 100,
      size: 7
    },
    {
      id: 3,
      card_number: 103,
      image_url: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Forest Guardian",
      animorph_type: "Nature",
      power: 75,
      health: 150,
      attack: 65,
      sats: 90,
      size: 6
    }
  ];

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
              Discover powerful Animorph cards to add to your collection. Each card offers unique abilities and strengths to help you dominate the battlefield.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {featuredCards.map((card) => (
              <CardDisplay key={card.id} card={card} />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link to="/card-gallery">
              <Button className="fantasy-button text-lg px-8 py-3">
                View All Cards
              </Button>
            </Link>
          </div>
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
