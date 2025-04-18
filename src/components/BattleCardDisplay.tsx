import React from "react";
import { AnimorphCard } from "@/types";
import CardDisplay from "./CardDisplay";
interface BattleCardDisplayProps {
  card?: AnimorphCard;
  isFlipped: boolean;
  isActive: boolean;
  roundWins: number;
  playerName: string;
  cardCount?: number;
  onStatSelect?: (stat: string) => void;
  selectedStat?: string | null;
}
const BattleCardDisplay: React.FC<BattleCardDisplayProps> = ({
  card,
  isFlipped,
  isActive,
  roundWins,
  playerName,
  cardCount,
  onStatSelect,
  selectedStat
}) => {
  const stats = ['power', 'health', 'attack', 'sats', 'size'];
  return <div className={`relative flex flex-col items-center ${isActive ? 'scale-105 z-10' : ''}`}>
      <div className="text-center mb-1 font-fantasy">
        <div className="text-lg">{playerName}</div>
        <div className="bg-fantasy-accent/20 px-3 py-1 rounded-full text-sm font-bold">
          Wins: {roundWins}
          {cardCount !== undefined && <span className="ml-2">Cards: {cardCount}</span>}
        </div>
      </div>
      
      {isFlipped ? card ? <div className="relative">
            <CardDisplay card={card} />
            
            {isActive && onStatSelect && <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2 flex-wrap">
                {stats.map(stat => <button key={stat} disabled={!!selectedStat} onClick={() => onStatSelect(stat)} className="font-bold text-lg rounded-lg bg-fuchsia-900 hover:bg-fuchsia-800 text-purple-400">
                    {stat}
                  </button>)}
              </div>}
          </div> : <div className="h-96 w-72 flex items-center justify-center bg-gray-800/50 rounded">
            <p>No cards left</p>
          </div> : card ? <div className="h-96 w-72 bg-fantasy-primary/20 rounded shadow-md flex items-center justify-center">
          <div className="font-fantasy text-xl text-gray-400">Card Back</div>
        </div> : <div className="h-96 w-72 flex items-center justify-center bg-gray-800/50 rounded">
          <p>No cards left</p>
        </div>}
    </div>;
};
export default BattleCardDisplay;