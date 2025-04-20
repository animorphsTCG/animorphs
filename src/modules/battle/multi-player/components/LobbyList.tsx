
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const LobbyList = () => {
  const navigate = useNavigate();

  const { data: lobbies, isLoading } = useQuery({
    queryKey: ['battle-lobbies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('battle_lobbies')
        .select(`
          *,
          participants:lobby_participants(count)
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Battle Lobbies</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {lobbies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active battle lobbies found
            </div>
          ) : (
            <div className="space-y-4">
              {lobbies?.map((lobby) => (
                <Card key={lobby.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{lobby.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lobby.battle_type} • {lobby.participants[0].count}/{lobby.max_players} Players
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/battle/lobby/${lobby.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
