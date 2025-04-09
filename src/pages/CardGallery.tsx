
import React, { useState, useEffect } from "react";
import CardDisplay from "@/components/CardDisplay";
import { AnimorphCard } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchAnimorphCards } from "@/lib/db";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CardGallery = () => {
  const [allCards, setAllCards] = useState<AnimorphCard[]>([]);
  const [cards, setCards] = useState<AnimorphCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedCard, setSelectedCard] = useState<AnimorphCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;
  
  const navigate = useNavigate();

  // Load cards from database
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        const loadedCards = await fetchAnimorphCards();
        if (loadedCards && loadedCards.length > 0) {
          setAllCards(loadedCards);
          setCards(loadedCards);
          toast({
            title: "Cards Loaded Successfully",
            description: `${loadedCards.length} Animorph cards found.`,
          });
        } else {
          setLoadingError("No cards found in the database.");
          toast({
            title: "No Cards Found",
            description: "There are no cards available in the gallery at this time.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading cards:", error);
        setLoadingError("Failed to load card data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load card data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCards();
  }, []);

  // Get unique card types
  const cardTypes = [...new Set(allCards.map(card => card.animorph_type))].filter(Boolean) as string[];

  // Handle search and filter
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterCards(term, typeFilter);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    filterCards(searchTerm, value);
    setCurrentPage(1);
  };

  const filterCards = (term: string, type: string) => {
    let filtered = allCards;
    
    if (term) {
      filtered = filtered.filter(card => 
        card.nft_name?.toLowerCase().includes(term.toLowerCase()) ||
        card.card_number.toString().includes(term)
      );
    }
    
    if (type && type !== "all") {
      filtered = filtered.filter(card => card.animorph_type === type);
    }
    
    setCards(filtered);
  };

  const handleCardClick = (card: AnimorphCard) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = cards.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent mr-2" />
        <p>Loading cards...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-center max-w-md p-6 bg-black/60 rounded-lg border border-fantasy-danger">
          <AlertTriangle className="h-12 w-12 text-fantasy-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-fantasy-danger">Gallery Error</h2>
          <p className="mb-4">{loadingError}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mr-2"
          >
            Try Again
          </Button>
          <Button 
            className="fantasy-button"
            onClick={() => navigate("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

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
                <SelectItem value="all">All Types</SelectItem>
                {cardTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Card Stats */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400">
            Showing {currentCards.length} of {cards.length} cards
            {typeFilter && typeFilter !== "all" ? ` (Type: ${typeFilter})` : ""}
            {searchTerm ? ` matching "${searchTerm}"` : ""}
          </p>
        </div>
        
        {/* Card Grid */}
        {currentCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {currentCards.map((card) => (
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="fantasy-button-outline"
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNum => 
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                )
                .map((pageNum, index, array) => {
                  // Add ellipsis
                  if (index > 0 && pageNum - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${pageNum}`}>
                        <Button 
                          variant="outline" 
                          disabled 
                          className="text-gray-400"
                        >
                          ...
                        </Button>
                        <Button
                          variant={pageNum === currentPage ? "default" : "outline"}
                          onClick={() => paginate(pageNum)}
                          className={pageNum === currentPage ? "fantasy-button" : "fantasy-button-outline"}
                        >
                          {pageNum}
                        </Button>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      onClick={() => paginate(pageNum)}
                      className={pageNum === currentPage ? "fantasy-button" : "fantasy-button-outline"}
                    >
                      {pageNum}
                    </Button>
                  );
                })
              }
              
              <Button
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="fantasy-button-outline"
              >
                Next
              </Button>
            </div>
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
