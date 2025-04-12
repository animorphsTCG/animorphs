
import React from "react";
import { AnimorphCard } from "@/types";
import BattleCardDisplay from "@/components/BattleCardDisplay";
import GameOverScreen from "./GameOverScreen";

interface BattleScreenProps {
  player1Cards: AnimorphCard[];
  player2Cards: AnimorphCard[];
  player1Turn: boolean;
  cardsRevealed: boolean;
  gameOver: boolean;
  winner: "player1" | "player2" | "draw" | null;
  handleStatSelection: (stat: string) => void;
  selectedStat: string | null;
  player1Wins: number;
  player2Wins: number;
  currentRound: number;
  suddenDeath: boolean;
  suddenDeathRound: number;
  suddenDeathWins: { player1: number; player2: number };
  message: string | null;
  username: string;
}

const BattleScreen: React.FC<BattleScreenProps> = ({
  player1Cards,
  player2Cards,
  player1Turn,
  cardsRevealed,
  gameOver,
  winner,
  handleStatSelection,
  selectedStat,
  player1Wins,
  player2Wins,
  currentRound,
  suddenDeath,
  suddenDeathRound,
  suddenDeathWins,
  message,
  username
}) => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="border-2 border-fantasy-primary bg-black/70 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-fantasy text-fantasy-accent">
            {suddenDeath ? "Sudden Death" : "1v1 Battle"}
          </h1>
          
          <div className="flex items-center gap-4">
            {suddenDeath && (
              <div className="bg-red-500/20 px-3 py-1 rounded-full">
                SD Round: {suddenDeathRound}
              </div>
            )}
            
            <div className="bg-fantasy-primary/20 p-3 rounded">
              <p className="text-lg">Round: {currentRound} / 10</p>
            </div>
          </div>
        </div>
        
        {message && (
          <div className="bg-fantasy-accent/20 p-4 rounded-md text-center mb-8">
            <p className="text-lg font-bold">{message}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          <BattleCardDisplay
            card={player1Cards[0]}
            isFlipped={true}
            isActive={player1Turn && !cardsRevealed && !gameOver}
            roundWins={suddenDeath ? suddenDeathWins.player1 : player1Wins}
            playerName={username}
            onStatSelect={player1Turn && !cardsRevealed && !gameOver ? handleStatSelection : undefined}
            selectedStat={selectedStat}
          />
          
          <BattleCardDisplay
            card={player2Cards[0]}
            isFlipped={cardsRevealed}
            isActive={!player1Turn && !cardsRevealed && !gameOver}
            roundWins={suddenDeath ? suddenDeathWins.player2 : player2Wins}
            playerName="AI Opponent"
          />
        </div>
        
        {gameOver && <GameOverScreen winner={winner} />}
      </div>
    </div>
  );
};

export default BattleScreen;
