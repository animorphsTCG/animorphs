import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiClient, LeaderboardEntry } from "@/lib/api";
import { ArrowLeft, Trophy, Crown, Medal, Target } from "lucide-react";
import { Link } from "react-router-dom";
const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadLeaderboard();
  }, []);
  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      toast({
        title: "Failed to load leaderboard",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-yellow-600";
    if (rank <= 10) return "bg-gradient-to-r from-purple-600 to-blue-600";
    return "bg-gradient-to-r from-gray-600 to-gray-700";
  };
  const getWinRate = (wins: number, total: number): number => {
    return total > 0 ? Math.round(wins / total * 100) : 0;
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
              <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            </div>
            
            <Button onClick={loadLeaderboard} variant="outline" className="text-white border-white hover:text-black bg-sky-600 hover:bg-sky-500">
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Leaderboard Header */}
        <Card className="bg-black/20 border-white/10 text-white mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2 flex items-center justify-center space-x-2">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <span>Global Rankings</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Compete for the top spot and earn LBP (Leaderboard Points)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="md:order-1 flex flex-col items-center">
              <Card className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400/30 text-white w-full">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-8 w-8 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">2nd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-xl font-bold mb-1">{leaderboard[1].eos_id || `Player ${leaderboard[1].user_id}`}</div>
                  <div className="text-2xl font-bold text-gray-400 mb-2">{leaderboard[1].lbp_points} LBP</div>
                  <div className="text-sm text-gray-300">
                    {leaderboard[1].total_wins}W / {leaderboard[1].total_matches - leaderboard[1].total_wins}L
                    ({getWinRate(leaderboard[1].total_wins, leaderboard[1].total_matches)}%)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 1st Place */}
            <div className="md:order-2 flex flex-col items-center">
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-white w-full transform md:scale-110">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <Crown className="h-10 w-10 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl">Champion</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold mb-1">{leaderboard[0].eos_id || `Player ${leaderboard[0].user_id}`}</div>
                  <div className="text-3xl font-bold text-yellow-500 mb-2">{leaderboard[0].lbp_points} LBP</div>
                  <div className="text-sm text-gray-300">
                    {leaderboard[0].total_wins}W / {leaderboard[0].total_matches - leaderboard[0].total_wins}L
                    ({getWinRate(leaderboard[0].total_wins, leaderboard[0].total_matches)}%)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3rd Place */}
            <div className="md:order-3 flex flex-col items-center">
              <Card className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border-amber-600/30 text-white w-full">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-8 w-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">3rd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-xl font-bold mb-1">{leaderboard[2].eos_id || `Player ${leaderboard[2].user_id}`}</div>
                  <div className="text-2xl font-bold text-amber-600 mb-2">{leaderboard[2].lbp_points} LBP</div>
                  <div className="text-sm text-gray-300">
                    {leaderboard[2].total_wins}W / {leaderboard[2].total_matches - leaderboard[2].total_wins}L
                    ({getWinRate(leaderboard[2].total_wins, leaderboard[2].total_matches)}%)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>}

        {/* Full Leaderboard */}
        <Card className="bg-black/20 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-400" />
              <span>Full Rankings</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Complete leaderboard with detailed statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? <div className="space-y-2">
                {leaderboard.map((entry, index) => {
              const rank = index + 1;
              return <div key={entry.user_id} className={`flex items-center justify-between p-4 rounded-lg ${getRankBadge(rank)}/10 border border-white/10 hover:bg-white/5 transition-colors`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(rank)}
                        </div>
                        
                        <div>
                          <div className="font-semibold text-lg">
                            {entry.eos_id || `Player ${entry.user_id}`}
                          </div>
                          <div className="text-sm text-gray-300">
                            {entry.total_wins} wins • {entry.total_matches} total matches
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">
                          {entry.lbp_points}
                        </div>
                        <div className="text-sm text-gray-300">
                          LBP Points
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {getWinRate(entry.total_wins, entry.total_matches)}% Win Rate
                        </Badge>
                      </div>
                    </div>;
            })}
              </div> : <div className="text-center py-12 text-gray-400">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No rankings yet</p>
                <p className="text-sm">Be the first to battle and claim the top spot!</p>
                <Link to="/battle" className="mt-4 inline-block">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Start Battling
                  </Button>
                </Link>
              </div>}
          </CardContent>
        </Card>

        {/* How LBP Works */}
        <Card className="bg-black/20 border-white/10 text-white mt-8">
          <CardHeader>
            <CardTitle>How LBP Points Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-400">Earning Points</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Win against AI: +10 LBP</li>
                  <li>• Win against Player: +25 LBP</li>
                  <li>• Tournament Victory: +100 LBP</li>
                  <li>• Daily Login Bonus: +5 LBP</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-400">Losing Points</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Lose against Player: -5 LBP</li>
                  <li>• Forfeit Match: -10 LBP</li>
                  <li>• Inactivity (7 days): -20 LBP</li>
                  <li>• Minimum LBP: 0 (can't go negative)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Leaderboard;