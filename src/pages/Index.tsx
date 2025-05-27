
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Music, Trophy, Wallet, Users, Zap } from "lucide-react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              {isConnected ? "Connected" : "Connect Wallet"}
            </Button>
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
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
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
    </div>
  );
};

export default Index;
