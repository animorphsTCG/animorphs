
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User, Wallet, ExternalLink, Zap, ShoppingCart } from "lucide-react";
import { apiClient, User as UserType, UserCard, getCardImageUrl, getElementColor } from "@/lib/api";
import { web3Manager, formatAddress } from "@/lib/web3";

interface ProfileProps {
  user: UserType;
}

const Profile = ({ user }: ProfileProps) => {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadUserCards();
  }, [user.id]);

  const loadUserCards = async () => {
    try {
      setIsLoading(true);
      const cards = await apiClient.getUserCards(user.id);
      setUserCards(cards);
    } catch (error) {
      console.error('Failed to load user cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNFTs = async () => {
    if (!user.wallet_address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSyncing(true);
      const result = await apiClient.syncNFTs(user.wallet_address);
      await loadUserCards(); // Reload cards after sync
      
      toast({
        title: "NFTs Synchronized",
        description: `Found ${result.synced} new NFTs in your wallet`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync NFTs",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const groupCardsByElement = (cards: UserCard[]) => {
    const grouped: { [key: string]: UserCard[] } = {};
    cards.forEach(card => {
      if (card.card) {
        const element = card.card.animorph_type;
        if (!grouped[element]) grouped[element] = [];
        grouped[element].push(card);
      }
    });
    return grouped;
  };

  const groupedCards = groupCardsByElement(userCards);
  const totalCards = userCards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Profile Header */}
        <Card className="bg-black/20 border-white/10 text-white mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Player Profile</CardTitle>
                  <CardDescription className="text-gray-300">
                    EOS ID: {user.eos_id}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user.has_battle_pass && (
                  <Badge className="bg-gradient-to-r from-green-600 to-blue-600">
                    Battle Pass Active
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Wallet Connection</h3>
                {user.wallet_address ? (
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">{formatAddress(user.wallet_address)}</span>
                    <Button size="sm" onClick={handleSyncNFTs} disabled={isSyncing}>
                      {isSyncing ? "Syncing..." : "Sync NFTs"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">No wallet connected</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Collection Stats</h3>
                <div className="text-gray-300">
                  <p>Total Cards: {totalCards}</p>
                  <p>Unique Cards: {userCards.length}</p>
                  <p>Elements: {Object.keys(groupedCards).length}/5</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase NFTs Section */}
        <Card className="bg-black/20 border-white/10 text-white mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-yellow-400" />
              <span>Expand Your Collection</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Purchase additional NFT cards to strengthen your deck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 mb-2">
                  Browse and purchase new Animorph cards on OpenSea marketplace
                </p>
                <p className="text-sm text-gray-400">
                  Contract: 0xb08882e1804B444171B560Cf7cEe99aDD26f7f62
                </p>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <a
                  href="https://opensea.io/collection/zar-sales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on OpenSea</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NFT Collection */}
        <Card className="bg-black/20 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-yellow-400" />
              <span>Your NFT Collection</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Cards you own and can use in battles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading your collection...</p>
              </div>
            ) : userCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No NFT cards found in your collection</p>
                <p className="text-sm text-gray-500">
                  Connect your wallet and purchase cards from OpenSea to start playing
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedCards).map(([element, cards]) => (
                  <div key={element}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-sm ${getElementColor(element)}`}>
                        {element}
                      </span>
                      <span className="text-gray-400">({cards.length} cards)</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {cards.map((userCard) => (
                        <div key={userCard.token_id} className="relative">
                          <div className="bg-black/40 rounded-lg p-2 border border-white/20">
                            <img
                              src={getCardImageUrl(userCard.card!)}
                              alt={userCard.card!.display_name}
                              className="w-full aspect-[3/4] object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <div className="mt-2">
                              <p className="text-xs font-medium truncate">
                                {userCard.card!.display_name}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">
                                  #{userCard.card!.token_id}
                                </span>
                                {userCard.quantity > 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    x{userCard.quantity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
