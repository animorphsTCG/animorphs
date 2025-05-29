import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Music, Trophy, Wallet, Users, Zap, Shield } from "lucide-react";
import { eosManager } from "@/lib/eos";
import { web3Manager } from "@/lib/web3";
import { AuthForm } from "@/components/AuthForm";
import { PasswordDialog, AIAssistantPage } from "@/components/AIAssistant";
const Index = () => {
  const [isEOSAuthenticated, setIsEOSAuthenticated] = useState(false);
  const [walletConnection, setWalletConnection] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  useEffect(() => {
    // Check authentication status on load
    const checkAuthStatus = () => {
      const eosUser = localStorage.getItem('eos_user');
      const walletAddress = localStorage.getItem('wallet_address');
      setIsEOSAuthenticated(!!eosUser);
      if (walletAddress) {
        setWalletConnection({
          address: walletAddress,
          isConnected: true
        });
      }
    };
    checkAuthStatus();
  }, []);
  const handleConnectWallet = async () => {
    if (!isEOSAuthenticated) {
      return; // Should not happen due to UI logic, but safety check
    }
    try {
      setIsConnecting(true);
      const connection = await web3Manager.connectWallet();
      setWalletConnection(connection);
      localStorage.setItem('wallet_address', connection.address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  const getConnectButtonText = () => {
    if (!isEOSAuthenticated) {
      return "Login with Epic Games First";
    }
    if (walletConnection?.isConnected) {
      return `Connected: ${walletConnection.address.substring(0, 8)}...`;
    }
    return isConnecting ? "Connecting..." : "Connect Wallet";
  };
  const shouldShowConnectButton = () => {
    return isEOSAuthenticated;
  };
  const handleLoginClick = () => {
    setShowAuthForm(true);
  };
  const handleAuthClose = () => {
    setShowAuthForm(false);
  };
  const handleAIAccess = () => {
    setShowPasswordDialog(true);
  };
  const handleAIAuthenticated = () => {
    setShowAIAssistant(true);
  };
  const handleBackFromAI = () => {
    setShowAIAssistant(false);
  };
  if (showAIAssistant) {
    return <AIAssistantPage onBack={handleBackFromAI} />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Animorphs TCG</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link to="/collection" className="text-white hover:text-yellow-400 transition-colors">Collection</Link>
            <Link to="/battle" className="text-white hover:text-yellow-400 transition-colors">Battle</Link>
            <Link to="/music" className="text-white hover:text-yellow-400 transition-colors">Music</Link>
            <Link to="/leaderboard" className="text-white hover:text-yellow-400 transition-colors">Leaderboard</Link>
            <Link to="/profile" className="text-white hover:text-yellow-400 transition-colors">Profile</Link>
            
            {!isEOSAuthenticated ? <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black bg-transparent" onClick={handleLoginClick}>
                <Zap className="h-4 w-4 mr-2" />
                Login with Epic Games
              </Button> : shouldShowConnectButton() ? <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black" onClick={handleConnectWallet} disabled={isConnecting || walletConnection?.isConnected}>
                <Wallet className="h-4 w-4 mr-2" />
                {getConnectButtonText()}
              </Button> : null}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Transform. Battle. Conquer.
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Enter the world of Animorphs TCG where elemental creatures clash in epic battles. 
          Collect NFT cards, build powerful decks, and rise through the leaderboards.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Start Playing
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:text-black bg-blue-600 hover:bg-blue-500">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-yellow-400" />
                <span>NFT Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Own unique ERC-1155 NFT cards on Polygon. 200 cards across 5 elements: Fire, Water, Ice, Ground, Electric.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gamepad2 className="h-6 w-6 text-red-400" />
                <span>Epic Battles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Engage in turn-based combat using strategy and elemental advantages. Battle AI or challenge other players.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-green-400" />
                <span>Music Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Enjoy 235 MP3 tracks while playing. Free users get 5 songs, Battle Pass unlocks the full library.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-purple-400" />
                <span>Tournaments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Battle Pass holders can enter cash-prize tournaments and compete for real rewards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-400" />
                <span>Epic Online Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Powered by EOS for seamless matchmaking, voice chat, achievements, and social features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-400" />
                <span>Demo Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Try the game with 10v10 AI battles without needing to login or connect a wallet.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Get Started</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Starter Deck</CardTitle>
              <CardDescription className="text-center text-gray-300">
                Perfect for new players
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold mb-4">R100 ZAR</div>
              <ul className="space-y-2 mb-6">
                <li>200 NFT Cards</li>
                <li>40 of each element</li>
                <li>Instant delivery</li>
                <li>Full ownership</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                Buy Deck
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Battle Pass</CardTitle>
              <CardDescription className="text-center text-gray-300">
                Unlock premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold mb-4">R30 ZAR<span className="text-lg">/year</span></div>
              <ul className="space-y-2 mb-6">
                <li>235 MP3 music tracks</li>
                <li>Cash-prize tournaments</li>
                <li>Exclusive features</li>
                <li>Annual subscription</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
                Get Battle Pass
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>&copy; 2024 Animorphs TCG. Powered by Epic Online Services & Polygon Network.</p>
        </div>
      </footer>

      {/* AI Assistant Access Button */}
      <Button onClick={handleAIAccess} className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg" size="icon">
        <Shield className="h-6 w-6" />
      </Button>

      {/* Password Dialog */}
      <PasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} onAuthenticated={handleAIAuthenticated} />

      {/* Auth Form Modal */}
      {showAuthForm && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <Button variant="ghost" size="sm" className="absolute -top-12 right-0 text-white hover:text-gray-300" onClick={handleAuthClose}>
              ✕ Close
            </Button>
            <AuthForm onAuthSuccess={user => {
          setShowAuthForm(false);
          window.location.href = '/profile';
        }} />
          </div>
        </div>}
    </div>;
};
export default Index;