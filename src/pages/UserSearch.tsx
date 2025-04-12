
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, User } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  playing_times: string | null;
  country: string | null;
  profile_image_url: string | null;
}

const UserSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Initial fetch of recently active users
  useEffect(() => {
    const fetchRecentUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, name, surname, playing_times, country, profile_image_url")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching users:", error);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentUsers();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // Search by username, name, or surname containing the query string
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, name, surname, playing_times, country, profile_image_url")
        .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,surname.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error("Error searching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2 border-fantasy-primary bg-black/70">
        <CardHeader>
          <CardTitle className="text-3xl font-fantasy text-fantasy-accent">Find Players</CardTitle>
          <CardDescription>Search for other Animorph Battle players</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800"
            />
            <Button type="submit" disabled={loading} className="fantasy-button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </form>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-fantasy-accent" />
            </div>
          )}

          {!loading && users.length === 0 && hasSearched && (
            <div className="text-center py-8 text-gray-400">
              No users found matching "{searchQuery}"
            </div>
          )}

          {!loading && users.length === 0 && !hasSearched && (
            <div className="text-center py-8 text-gray-400">
              Search for players by username or name
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="bg-gray-900/60 hover:bg-gray-800/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_image_url || ""} />
                      <AvatarFallback className="bg-fantasy-accent/20">
                        {user.username?.substring(0, 2).toUpperCase() || <User />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">{user.username}</h3>
                      <p className="text-sm text-gray-400">
                        {user.name} {user.surname}
                        {user.country && ` • ${user.country}`}
                      </p>
                      {user.playing_times && (
                        <p className="text-xs text-fantasy-accent mt-1">
                          Plays: {user.playing_times}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSearch;
