
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats } from "../utils/userStats";

interface UserStatsCardProps {
  stats: UserStats;
}

export const UserStatsCard = ({ stats }: UserStatsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-2xl font-bold">{stats.paidUsers}</div>
            <div className="text-sm text-muted-foreground">Paid Users</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-2xl font-bold">{stats.musicSubscribers}</div>
            <div className="text-sm text-muted-foreground">Music Subscribers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
