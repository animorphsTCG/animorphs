
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Zap, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  avatar?: string;
}

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("mp");
  
  // Mock leaderboard data - in a real implementation this would be fetched from the database
  const mpLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: "CardMaster", score: 850 },
    { rank: 2, username: "BattleKing", score: 742 },
    { rank: 3, username: "ElitePlayer", score: 601 },
    { rank: 4, username: "AnimorphChamp", score: 587 },
    { rank: 5, username: "TopDeck", score: 512 },
    { rank: 6, username: "ProGamer", score: 493 },
    { rank: 7, username: "CardWizard", score: 475 },
    { rank: 8, username: "StrategyGuru", score: 462 },
    { rank: 9, username: "BattleExpert", score: 431 },
    { rank: 10, username: "MasterPlayer", score: 408 },
  ];
  
  const lbpLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: "TourneyKing", score: 1250 },
    { rank: 2, username: "RankOnePlayer", score: 1187 },
    { rank: 3, username: "BattleMaster", score: 976 },
    { rank: 4, username: "EliteChamp", score: 934 },
    { rank: 5, username: "ProLeague", score: 876 },
    { rank: 6, username: "TopCompetitor", score: 842 },
    { rank: 7, username: "AnimorphLord", score: 811 },
    { rank: 8, username: "MasterStrategist", score: 795 },
    { rank: 9, username: "CardLegend", score: 764 },
    { rank: 10, username: "ApexBattler", score: 732 },
  ];
  
  const aiLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: "AISlayer", score: 387 },
    { rank: 2, username: "MachineMaster", score: 351 },
    { rank: 3, username: "RobotDominator", score: 328 },
    { rank: 4, username: "AIChallenger", score: 302 },
    { rank: 5, username: "TechWizard", score: 278 },
    { rank: 6, username: "AlgorithmGod", score: 263 },
    { rank: 7, username: "NeuralNinja", score: 251 },
    { rank: 8, username: "DeepLearner", score: 242 },
    { rank: 9, username: "AIConqueror", score: 235 },
    { rank: 10, username: "SiliconSlayer", score: 219 },
  ];
  
  const renderLeaderboard = (data: LeaderboardEntry[]) => {
    return (
      <div className="mt-4">
        <div className="grid grid-cols-12 py-3 px-4 bg-fantasy-primary/20 rounded-t-md font-medium">
          <div className="col-span-1">Rank</div>
          <div className="col-span-8">Player</div>
          <div className="col-span-3 text-right">Score</div>
        </div>
        
        {data.map((entry, index) => (
          <div 
            key={index}
            className={`grid grid-cols-12 py-3 px-4 border-b border-gray-800 ${
              index % 2 === 0 ? "bg-gray-900/30" : "bg-gray-900/10"
            } ${index < 3 ? "font-medium" : ""}`}
          >
            <div className="col-span-1 flex items-center">
              {index === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
              {index === 1 && <Medal className="h-5 w-5 text-gray-300" />}
              {index === 2 && <Award className="h-5 w-5 text-amber-700" />}
              {index > 2 && entry.rank}
            </div>
            <div className="col-span-8 flex items-center">
              {entry.avatar ? (
                <img src={entry.avatar} alt={entry.username} className="w-8 h-8 rounded-full mr-2" />
              ) : (
                <div className="w-8 h-8 bg-fantasy-primary/30 rounded-full flex items-center justify-center mr-2">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
              )}
              {entry.username}
            </div>
            <div className="col-span-3 text-right font-mono">{entry.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-fantasy text-fantasy-accent text-center mb-8">Animorph Leaderboards</h1>
      
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="font-fantasy text-fantasy-accent flex items-center gap-2 justify-center">
            <Trophy className="h-6 w-6 text-yellow-400" /> 
            Top Players Rankings
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="mp" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mp" className="flex items-center gap-1">
                <Zap className="h-4 w-4" /> MP Rankings
              </TabsTrigger>
              <TabsTrigger value="lbp" className="flex items-center gap-1">
                <Trophy className="h-4 w-4" /> LBP Rankings
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Award className="h-4 w-4" /> AI Rankings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="mp" className="mt-4">
              <div className="mb-4">
                <h3 className="text-xl font-medium">Match Points (MP) Leaderboard</h3>
                <p className="text-sm text-gray-400">Rankings based on total match victories</p>
              </div>
              {renderLeaderboard(mpLeaderboard)}
            </TabsContent>
            
            <TabsContent value="lbp" className="mt-4">
              <div className="mb-4">
                <h3 className="text-xl font-medium">Leaderboard Points (LBP) Rankings</h3>
                <p className="text-sm text-gray-400">Tournament and Sudden Death performance rankings</p>
              </div>
              {renderLeaderboard(lbpLeaderboard)}
            </TabsContent>
            
            <TabsContent value="ai" className="mt-4">
              <div className="mb-4">
                <h3 className="text-xl font-medium">AI Battle Points Rankings</h3>
                <p className="text-sm text-gray-400">Rankings for victories against AI opponents</p>
              </div>
              {renderLeaderboard(aiLeaderboard)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
