
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useR2Songs } from '@/hooks/useR2Songs';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCcw, Database, Play, Disc, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { d1 } from '@/lib/d1Database';

// Define a type that matches the R2Song type from useR2Songs hook
interface R2Song {
  name: string;
  title: string;
  artist?: string;
  size: number;
  lastModified: number;
}

const R2SongManagement: React.FC = () => {
  const { songs, isLoading, refreshSongs, syncSongsWithDatabase } = useR2Songs();
  const [filteredSongs, setFilteredSongs] = useState<R2Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [songStats, setSongStats] = useState({
    total: 0,
    synced: 0,
    notSynced: 0
  });
  
  useEffect(() => {
    if (songs && songs.length > 0) {
      // Cast the songs to the R2Song type
      const typedSongs = songs as unknown as R2Song[];
      setFilteredSongs(typedSongs);
      calculateStats(typedSongs);
    }
  }, [songs, searchQuery]);
  
  const filterSongs = () => {
    if (!searchQuery.trim() || !songs || songs.length === 0) {
      // Cast the songs to the R2Song type
      setFilteredSongs(songs as unknown as R2Song[]);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const typedSongs = songs as unknown as R2Song[];
    const results = typedSongs.filter(song => 
      song.name.toLowerCase().includes(query) || 
      song.title.toLowerCase().includes(query) ||
      (song.artist && song.artist.toLowerCase().includes(query))
    );
    
    setFilteredSongs(results);
  };
  
  const calculateStats = async (songList: R2Song[]) => {
    try {
      // Check how many songs are already synced
      const results = await d1.from('songs')
        .where('r2_key', '!=', '')
        .select('r2_key')
        .get();
        
      const syncedSongs = new Set((results.data as any[]).map(row => row.r2_key));
      
      setSongStats({
        total: songList.length,
        synced: syncedSongs.size,
        notSynced: songList.length - syncedSongs.size
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };
  
  const handleSyncWithDatabase = async () => {
    try {
      setIsSyncing(true);
      await syncSongsWithDatabase();
      toast({
        title: "Sync Complete",
        description: `${songs.length} songs synced with the database.`
      });
      calculateStats();
    } catch (error) {
      console.error('Error syncing songs:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync songs with database.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatSize = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc className="h-5 w-5 text-fantasy-accent" />
          <h2 className="text-xl font-semibold">R2 Song Management</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshSongs}
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button 
            size="sm"
            onClick={handleSyncWithDatabase}
            disabled={isSyncing || isLoading}
          >
            <Database className="h-4 w-4 mr-1" /> 
            {isSyncing ? 'Syncing...' : 'Sync with Database'}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>R2 Songs ({songs.length})</span>
            <div className="flex items-center gap-1 text-sm font-normal">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Synced: {songStats.synced}
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                Not Synced: {songStats.notSynced}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="border rounded-md mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Song</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSongs.length > 0 ? (
                      filteredSongs.map((song) => (
                        <TableRow key={song.name}>
                          <TableCell className="font-medium">{song.title}</TableCell>
                          <TableCell>{song.artist || 'Unknown'}</TableCell>
                          <TableCell>{formatSize(song.size)}</TableCell>
                          <TableCell>
                            {new Date(song.lastModified).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <span className="rounded-full w-3 h-3 bg-green-500"></span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {searchQuery ? 'No songs match your search.' : 'No songs available.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredSongs.length} of {songs.length} songs.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default R2SongManagement;
