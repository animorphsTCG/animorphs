
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CardGrid } from "@/components/CardDisplay";
import { apiClient, Card as CardData } from "@/lib/api";
import { web3Manager } from "@/lib/web3";
import { ArrowLeft, Wallet, RefreshCw, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";

interface CollectionProps {
  user: any;
}

interface UserCardData extends CardData {
  quantity?: number;
}

const Collection = ({ user }: CollectionProps) => {
  const [userCards, setUserCards] = useState<UserCardData[]>([]);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedElement, setSelectedElement] = useState<string>("all");
  const [isSync, setIsSync] = useState(false);

  const elements = ["all", "Fire", "Water", "Ice", "Ground", "Electric"];

  useEffect(() => {
    loadCards();
  }, [user.id]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      
      // Load all available cards
      const cards = await apiClient.getAllCards();
      setAllCards(cards);

      // Load user's cards if not in demo mode
      if (user.id !== 0) {
        const userCardData = await apiClient.getUserCards(user.id);
        const userCardsWithDetails: UserCardData[] = userCardData.map(uc => ({
          ...uc.card!,
          quantity: uc.quantity,
        }));
        setUserCards(userCardsWithDetails);
      } else {
        // Demo mode - show some sample cards
        const demoCards: UserCardData[] = cards.slice(0, 20).map(card => ({
          ...card,
          quantity: Math.floor(Math.random() * 3) + 1,
        }));
        setUserCards(demoCards);
      }
    } catch (error) {
      toast({
        title: "Failed to load cards",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNFTs = async () => {
    if (!user.wallet_address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to sync NFTs",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSync(true);
      const result = await apiClient.syncNFTs(user.wallet_address);
      
      toast({
        title: "NFTs Synchronized",
        description: `Synced ${result.synced} NFTs to your collection`,
      });

      // Reload cards to show updated collection
      await loadCards();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync NFTs",
        variant: "destructive",
      });
    } finally {
      setIsSync(false);
    }
  };

  const filteredUserCards = userCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesElement = selectedElement === "all" || card.element === selectedElement;
    return matchesSearch && matchesElement;
  });

  const filteredAllCards = allCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesElement = selectedElement === "all" || card.element === selectedElement;
    return matchesSearch && matchesElement;
  });

  const getCollectionStats = () => {
    const totalOwned = userCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const uniqueCards = userCards.length;
    const totalCards = allCards.length;
    
    return { totalOwned, uniqueCards, totalCards };
  };

  const stats = getCollectionStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Card Collection</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user.wallet_address && (
                <Button
                  onClick={handleSyncNFTs}
                  disabled={isSync}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  {isSync ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  Sync NFTs
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.totalOwned}</div>
              <p className="text-sm text-gray-300">Cards owned</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Unique Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{stats.uniqueCards}</div>
              <p className="text-sm text-gray-300">Out of {stats.totalCards} total</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {stats.totalCards > 0 ? Math.round((stats.uniqueCards / stats.totalCards) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-300">Collection complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-black/20 border-white/10 text-white mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={selectedElement} onValueChange={setSelectedElement}>
                  <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {elements.map(element => (
                      <SelectItem key={element} value={element}>
                        {element === "all" ? "All Elements" : element}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Tabs */}
        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border-white/10">
            <TabsTrigger value="owned" className="data-[state=active]:bg-white/20 text-white">
              My Cards ({filteredUserCards.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white/20 text-white">
              All Cards ({filteredAllCards.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="owned" className="mt-6">
            <CardGrid
              cards={filteredUserCards}
              showQuantity={true}
              emptyMessage="No cards in your collection"
            />
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <CardGrid
              cards={filteredAllCards}
              emptyMessage="No cards found"
            />
          </TabsContent>
        </Tabs>

        {/* Purchase Section */}
        {userCards.length === 0 && user.id !== 0 && (
          <Card className="bg-black/20 border-white/10 text-white mt-8">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription className="text-gray-300">
                Purchase your first deck to start collecting NFT cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Buy Starter Deck (R100 ZAR)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Collection;
