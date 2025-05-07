
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AnimorphCard } from "@/types";
import { fetchAnimorphCards } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/modules/auth/context/AuthContext"; // Use the correct import
import { Loader2, Check, X, Users, Clock, AlertCircle } from "lucide-react";

const Multiplayer = () => {
  const navigate = useNavigate();
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const [allCards, setAllCards] = useState<AnimorphCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [selectedCards, setSelectedCards] = useState<AnimorphCard[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [queueInterval, setQueueInterval] = useState<NodeJS.Timeout | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  // Load cards on component mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await fetchAnimorphCards(200);
        setAllCards(cards);
      } catch (error) {
        console.error("Error loading cards:", error);
        toast({
          title: "Error",
          description: "Failed to load cards. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCards();
  }, []);
  
  // Check if user is paid with explicit verification
  useEffect(() => {
    // Only run payment verification if user is logged in but not yet confirmed as paid
    if (!isLoading && user && userProfile && !userProfile.has_paid) {
      const verifyPaymentStatus = async () => {
        setCheckingPayment(true);
        console.log("Verifying payment status explicitly...");
        
        try {
          // Explicit check against payment_status table
          const { data, error } = await supabase
            .from('payment_status')
            .select('has_paid')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error verifying payment status:", error);
            throw error;
          }
          
          const isPaid = data?.has_paid || false;
          console.log("Explicit payment verification result:", isPaid);
          
          // If payment status doesn't match our current userProfile
          if (isPaid !== !!userProfile?.has_paid) {
            console.log("Payment status mismatch detected. Refreshing profile...");
            await refreshProfile();
          }
          
          if (!isPaid) {
            console.log("User does not have paid access");
            toast({
              title: "Access Denied",
              description: "Multiplayer is only available for paid users.",
              variant: "destructive",
            });
            navigate('/battle');
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
          toast({
            title: "Error",
            description: "There was a problem verifying your access. Please try again.",
            variant: "destructive",
          });
          navigate('/battle');
        } finally {
          setCheckingPayment(false);
        }
      };
      
      verifyPaymentStatus();
    }
  }, [user, userProfile, isLoading, navigate, refreshProfile]);
  
  // Handle card selection
  const toggleCardSelection = (card: AnimorphCard) => {
    if (inQueue) return; // Can't change deck when in queue
    
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
  
  // Join/leave battle queue
  const toggleQueue = async () => {
    if (!user) return;
    
    if (inQueue) {
      // Leave queue
      if (queueInterval) {
        clearInterval(queueInterval);
        setQueueInterval(null);
      }
      
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      
      // Update server-side queue status
      try {
        await supabase.from('battle_lobbies').delete().eq('host_id', user.id).eq('status', 'waiting');
        
        toast({
          title: "Left Queue",
          description: "You have left the battle queue.",
        });
      } catch (error) {
        console.error("Error leaving queue:", error);
      }
      
      setInQueue(false);
      setQueueTime(0);
    } else {
      // Join queue
      if (selectedCards.length !== 10) {
        toast({
          title: "Deck incomplete",
          description: "Please select exactly 10 cards for your deck.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        // Create a lobby for matchmaking
        const { data, error } = await supabase.from('battle_lobbies').insert({
          name: `${userProfile?.username || user.email}'s Queue`,
          host_id: user.id,
          max_players: 2,
          status: 'waiting',
          battle_type: '1v1',
          requires_payment: true
        }).select();
        
        if (error) throw error;
        
        const lobbyId = data?.[0]?.id;
        
        // Join as participant
        if (lobbyId) {
          await supabase.from('lobby_participants').insert({
            lobby_id: lobbyId,
            user_id: user.id,
            is_ready: true,
            player_number: 1
          });
          
          // Set up realtime subscription to listen for opponent
          const channel = supabase.channel(`lobby-${lobbyId}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'lobby_participants',
              filter: `lobby_id=eq.${lobbyId}`,
            }, (payload) => {
              // Check if this is a different user joining (not us)
              if (payload.new && payload.new.user_id !== user.id) {
                // Handle opponent joining
                handleOpponentFound(lobbyId);
              }
            })
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'battle_lobbies',
              filter: `id=eq.${lobbyId}`,
            }, (payload) => {
              // Check if lobby status changed to 'in_progress'
              if (payload.new && payload.new.status === 'in_progress') {
                // Redirect to battle
                navigate(`/battle/multiplayer/${lobbyId}`);
              }
            })
            .subscribe();
          
          setRealtimeChannel(channel);
        }
        
        // Start queue timer
        const interval = setInterval(() => {
          setQueueTime(prev => prev + 1);
        }, 1000);
        setQueueInterval(interval);
        
        toast({
          title: "Joined Queue",
          description: "You have joined the battle queue. Waiting for opponent...",
        });
        
        setInQueue(true);
        
        // For demonstration purposes - auto-find match after a random time (5-15s)
        // In a real app, this would be server-side matchmaking
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            // Simulate finding opponent
            handleOpponentFound(lobbyId);
          }, Math.floor(Math.random() * 10000) + 5000);
        }
        
      } catch (error) {
        console.error("Error joining queue:", error);
        toast({
          title: "Error",
          description: "Failed to join queue. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleOpponentFound = async (lobbyId: string) => {
    // Clean up timer
    if (queueInterval) {
      clearInterval(queueInterval);
      setQueueInterval(null);
    }
    
    toast({
      title: "Opponent Found!",
      description: "Preparing battle...",
    });
    
    // In a real implementation, you'd wait for both players to be ready
    // Then the server would create the battle session
    // For this demo, we'll navigate to the battle page
    try {
      // Update lobby status
      await supabase.from('battle_lobbies')
        .update({ status: 'in_progress' })
        .eq('id', lobbyId);
      
      // Create battle session
      const { data: sessionData } = await supabase.from('battle_sessions').insert({
        battle_type: '1v1',
        status: 'active'
      }).select();
      
      if (sessionData && sessionData[0]) {
        // Navigate to battle
        navigate(`/battle/multiplayer/${lobbyId}`);
      }
    } catch (error) {
      console.error("Error preparing battle:", error);
    }
  };
  
  // Format queue time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueInterval) {
        clearInterval(queueInterval);
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [queueInterval, realtimeChannel]);
  
  // If loading or checking payment, show loading state
  if (loading || isLoading || checkingPayment) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-fantasy-accent mb-2" />
          <p className="text-lg text-fantasy-accent">
            {loading ? "Loading cards..." : 
             checkingPayment ? "Verifying payment status..." : 
             "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Display access denied if user is not paid
  if (userProfile && !userProfile.has_paid) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="border-2 border-red-500 bg-black/70">
          <CardHeader>
            <CardTitle className="text-3xl font-fantasy text-red-500 flex items-center">
              <AlertCircle className="mr-2 h-6 w-6" /> Access Denied
            </CardTitle>
            <CardDescription>
              Multiplayer is only available for users who have purchased the full game.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please upgrade your account to access multiplayer features.
            </p>
            <Button className="fantasy-button" onClick={() => navigate('/battle')}>
              Return to Battle Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-fantasy text-fantasy-accent text-center mb-8">Multiplayer Battle</h1>
      
      {/* Queue Status */}
      {inQueue && (
        <Card className="mb-8 border-2 border-fantasy-accent bg-black/70">
          <CardHeader>
            <CardTitle className="text-2xl font-fantasy text-fantasy-accent flex items-center">
              <Clock className="mr-2 h-6 w-6" /> In Queue: {formatTime(queueTime)}
            </CardTitle>
            <CardDescription>
              Waiting for an opponent to join. You can leave the queue at any time.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={toggleQueue}
            >
              <X className="mr-2 h-4 w-4" /> Leave Queue
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Card Selection */}
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy text-fantasy-accent">
            Select Your Battle Deck
          </CardTitle>
          <CardDescription>
            Choose 10 cards for your deck. You can change your selection before joining the queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Selected Cards: {selectedCards.length}/10</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {selectedCards.map((card) => (
                <div 
                  key={card.id} 
                  className="border-2 border-fantasy-accent rounded-md p-2 cursor-pointer bg-fantasy-accent/10 hover:bg-fantasy-accent/20"
                  onClick={() => toggleCardSelection(card)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{card.nft_name}</h4>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <p>Type: {card.animorph_type}</p>
                  <div className="flex justify-between mt-1">
                    <span>ATK: {card.attack}</span>
                    <span>HP: {card.health}</span>
                    <span>PWR: {card.power}</span>
                  </div>
                </div>
              ))}
              {[...Array(Math.max(0, 10 - selectedCards.length))].map((_, i) => (
                <div key={i} className="border-2 border-dashed border-gray-500 rounded-md p-4 flex items-center justify-center">
                  <span className="text-gray-500">Empty Slot</span>
                </div>
              ))}
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Available Cards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-2">
            {allCards
              .filter(card => !selectedCards.some(c => c.id === card.id))
              .map((card) => (
                <div 
                  key={card.id} 
                  className="border border-fantasy-primary rounded-md p-2 cursor-pointer hover:bg-black/40"
                  onClick={() => toggleCardSelection(card)}
                >
                  <h4 className="font-medium">{card.nft_name}</h4>
                  <p>Type: {card.animorph_type}</p>
                  <div className="flex justify-between mt-1">
                    <span>ATK: {card.attack}</span>
                    <span>HP: {card.health}</span>
                    <span>PWR: {card.power}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/battle')}
          >
            Back to Battle Modes
          </Button>
          
          <Button
            className="fantasy-button"
            onClick={toggleQueue}
            disabled={inQueue || selectedCards.length !== 10}
          >
            {inQueue ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> In Queue...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" /> Ready for Battle
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Battle Information */}
      <Card className="mt-8 border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy text-fantasy-accent">
            Multiplayer Battle Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Select 10 cards for your battle deck</li>
            <li>Click "Ready for Battle" to join the matchmaking queue</li>
            <li>You'll be matched with another player of similar skill</li>
            <li>Battle results affect your profile stats:
              <ul className="list-disc pl-5 mt-2">
                <li><span className="text-green-500 font-medium">Win:</span> +1 Match Point (MP) and +1 Leaderboard Point (LBP)</li>
                <li><span className="text-red-500 font-medium">Loss:</span> +1 Match Point (MP)</li>
                <li><span className="text-yellow-500 font-medium">Tie:</span> Both players receive +1 Match Point (MP)</li>
              </ul>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Multiplayer;
