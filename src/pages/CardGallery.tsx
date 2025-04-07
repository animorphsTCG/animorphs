
import React, { useState } from "react";
import CardDisplay from "@/components/CardDisplay";
import { Card } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CardGallery = () => {
  // Sample card data
  const allCards: Card[] = [
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
    },
    {
      id: 4,
      card_number: 104,
      image_url: "https://images.unsplash.com/photo-1604623452055-586dd82bf6d6?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Shadow Assassin",
      animorph_type: "Dark",
      power: 110,
      health: 70,
      attack: 130,
      sats: 140,
      size: 5
    },
    {
      id: 5,
      card_number: 105,
      image_url: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1770&auto=format&fit=crop",
      nft_name: "Phoenix Mage",
      animorph_type: "Fire",
      power: 100,
      health: 85,
      attack: 120,
      sats: 130,
      size: 7
    },
    {
      id: 6,
      card_number: 106,
      image_url: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1974&auto=format&fit=crop",
      nft_name: "Ice Guardian",
      animorph_type: "Water",
      power: 85,
      health: 110,
      attack: 75,
      sats: 95,
      size: 8
    }
  ];

  const [cards, setCards] = useState<Card[]>(allCards);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get unique card types
  const cardTypes = [...new Set(allCards.map(card => card.animorph_type))].filter(Boolean) as string[];

  // Handle search and filter
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterCards(term, typeFilter);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    filterCards(searchTerm, value);
  };

  const filterCards = (term: string, type: string) => {
    let filtered = allCards;
    
    if (term) {
      filtered = filtered.filter(card => 
        card.nft_name?.toLowerCase().includes(term.toLowerCase()) ||
        card.card_number.toString().includes(term)
      );
    }
    
    if (type) {
      filtered = filtered.filter(card => card.animorph_type === type);
    }
    
    setCards(filtered);
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 font-fantasy">
          <span className="text-fantasy-accent">Animorph</span> Card Gallery
        </h1>
        <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          Browse through our collection of powerful Animorph battle cards. Each card has unique abilities and stats to help you in battle.
        </p>
        
        {/* Filters */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 justify-center items-center">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="Search by name or card number..."
              value={searchTerm}
              onChange={handleSearch}
              className="fantasy-input"
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="fantasy-input">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {cardTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Card Grid */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {cards.map((card) => (
              <CardDisplay 
                key={card.id} 
                card={card} 
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-gray-400">No cards found matching your filters.</p>
          </div>
        )}

        {/* Card Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black border-2 border-fantasy-primary max-w-4xl">
            {selectedCard && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/2">
                  <img 
                    src={selectedCard.image_url} 
                    alt={selectedCard.nft_name} 
                    className="w-full h-auto object-cover rounded-lg border-2 border-fantasy-accent"
                  />
                </div>
                <div className="lg:w-1/2">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-fantasy text-fantasy-accent">
                      {selectedCard.nft_name}
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Card #{selectedCard.card_number}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <span className="text-gray-400">Type: </span>
                      <span className="text-fantasy-secondary font-bold">{selectedCard.animorph_type}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-fantasy-primary/20 p-3 rounded">
                        <div className="text-sm text-gray-400">Power</div>
                        <div className="text-2xl font-bold text-white">{selectedCard.power}</div>
                      </div>
                      
                      <div className="bg-fantasy-success/20 p-3 rounded">
                        <div className="text-sm text-gray-400">Health</div>
                        <div className="text-2xl font-bold text-white">{selectedCard.health}</div>
                      </div>
                      
                      <div className="bg-fantasy-danger/20 p-3 rounded">
                        <div className="text-sm text-gray-400">Attack</div>
                        <div className="text-2xl font-bold text-white">{selectedCard.attack}</div>
                      </div>
                      
                      <div className="bg-fantasy-info/20 p-3 rounded">
                        <div className="text-sm text-gray-400">Size</div>
                        <div className="text-2xl font-bold text-white">{selectedCard.size}</div>
                      </div>
                    </div>
                    
                    <div className="bg-fantasy-secondary/20 p-3 rounded">
                      <div className="text-sm text-gray-400">SATS Value</div>
                      <div className="text-2xl font-bold text-fantasy-accent">{selectedCard.sats}</div>
                    </div>
                    
                    <p className="text-gray-300 italic">
                      Use this card in battles to take advantage of its unique abilities and powerful stats.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CardGallery;
