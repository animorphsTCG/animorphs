
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameOverScreenProps {
  winner: "player1" | "player2" | "draw" | null;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-8 text-center">
      <div className="bg-fantasy-accent/30 p-6 rounded mb-6">
        <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
        <p className="text-xl">
          {winner === "player1" && "You won the battle!"}
          {winner === "player2" && "AI won the battle!"}
          {winner === "draw" && "The battle ended in a draw!"}
        </p>
      </div>
      
      <div className="flex justify-center gap-4">
        <Button 
          className="fantasy-button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Play Again
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate("/battle")}
        >
          Back to Battle Menu
        </Button>
      </div>
    </div>
  );
};

export default GameOverScreen;
