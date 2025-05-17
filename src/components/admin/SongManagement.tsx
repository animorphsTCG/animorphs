
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { d1Worker } from '@/lib/cloudflare/d1Worker';
import { useAuth } from '@/modules/auth';
import { useAdmin } from '@/modules/admin';
import { Pencil, Trash, Save, X, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function SongManagement() {
  const { token } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editingSong, setEditingSong] = useState<string | null>(null);
  const [songData, setSongData] = useState<Record<string, any>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSong, setNewSong] = useState({
    title: '',
    youtube_url: '',
    preview_start_seconds: 0,
    preview_duration_seconds: 30
  });
  
  // Load songs
  useEffect(() => {
    const fetchSongs = async () => {
      if (!token?.access_token) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const result = await d1Worker.query(
          'SELECT * FROM songs ORDER BY title ASC',
          {},
          token.access_token
        );
        setSongs(result || []);
        setError(null);
      } catch (err) {
        console.error('Error loading songs:', err);
        setError(err instanceof Error ? err : new Error('Failed to load songs'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSongs();
  }, [token]);
  
  // Reset editing state when songs change
  useEffect(() => {
    setEditingSong(null);
  }, [songs]);
  
  if (!isAdmin) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p>You do not have permission to manage songs.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return <div className="p-4">Loading songs...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error loading songs: {error.message}</div>;
  }
  
  const startEditing = (song: any) => {
    setEditingSong(song.id);
    setSongData({
      title: song.title,
      youtube_url: song.youtube_url,
      preview_start_seconds: song.preview_start_seconds || 0,
      preview_duration_seconds: song.preview_duration_seconds || 30
    });
  };
  
  const cancelEditing = () => {
    setEditingSong(null);
    setSongData({});
  };
  
  const handleSaveEdit = async (songId: string) => {
    try {
      await d1Worker.execute(
        `UPDATE songs 
         SET title = ?, youtube_url = ?, preview_start_seconds = ?, preview_duration_seconds = ? 
         WHERE id = ?`,
        { params: [
          songData.title, 
          songData.youtube_url, 
          songData.preview_start_seconds, 
          songData.preview_duration_seconds, 
          songId
        ] },
        token?.access_token
      );
      
      // Update local state
      setSongs(prev => prev.map(song => 
        song.id === songId ? { ...song, ...songData } : song
      ));
      
      toast({
        title: 'Song Updated',
        description: 'The song has been successfully updated.'
      });
      
      setEditingSong(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update song.',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      await d1Worker.execute(
        'DELETE FROM songs WHERE id = ?',
        { params: [songId] },
        token?.access_token
      );
      
      // Update local state
      setSongs(prev => prev.filter(song => song.id !== songId));
      
      toast({
        title: 'Song Deleted',
        description: 'The song has been permanently deleted.'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete song.',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddSong = async () => {
    try {
      if (!newSong.title || !newSong.youtube_url) {
        toast({
          title: 'Missing Information',
          description: 'Please provide both title and YouTube URL.',
          variant: 'destructive'
        });
        return;
      }
      
      const id = crypto.randomUUID();
      
      await d1Worker.execute(
        `INSERT INTO songs (id, title, youtube_url, preview_start_seconds, preview_duration_seconds, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        { params: [
          id,
          newSong.title,
          newSong.youtube_url,
          newSong.preview_start_seconds,
          newSong.preview_duration_seconds
        ] },
        token?.access_token
      );
      
      // Update local state
      setSongs(prev => [...prev, { 
        id, 
        ...newSong,
        created_at: new Date().toISOString()
      }]);
      
      toast({
        title: 'Song Added',
        description: 'The new song has been successfully added.'
      });
      
      setIsAddingNew(false);
      setNewSong({
        title: '',
        youtube_url: '',
        preview_start_seconds: 0,
        preview_duration_seconds: 30
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add new song.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Song Management</h2>
        <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Song
        </Button>
      </div>
      
      {isAddingNew && (
        <div className="bg-card p-4 border rounded-md shadow space-y-4">
          <h3 className="font-semibold">Add New Song</h3>
          
          <div className="space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input 
              id="new-title" 
              value={newSong.title} 
              onChange={e => setNewSong({...newSong, title: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-youtube">YouTube URL</Label>
            <Input 
              id="new-youtube" 
              value={newSong.youtube_url} 
              onChange={e => setNewSong({...newSong, youtube_url: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-start">Preview Start (seconds)</Label>
              <Input 
                id="new-start" 
                type="number" 
                value={newSong.preview_start_seconds} 
                onChange={e => setNewSong({...newSong, preview_start_seconds: Number(e.target.value)})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-duration">Preview Duration (seconds)</Label>
              <Input 
                id="new-duration" 
                type="number" 
                value={newSong.preview_duration_seconds} 
                onChange={e => setNewSong({...newSong, preview_duration_seconds: Number(e.target.value)})} 
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingNew(false)}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleAddSong}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      )}
      
      <div className="border rounded-md shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>YouTube URL</TableHead>
              <TableHead>Preview Start</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No songs found
                </TableCell>
              </TableRow>
            ) : (
              songs.map(song => (
                <TableRow key={song.id}>
                  <TableCell>
                    {editingSong === song.id ? (
                      <Input 
                        value={songData.title} 
                        onChange={e => setSongData({...songData, title: e.target.value})} 
                      />
                    ) : (
                      song.title
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[200px]">
                    {editingSong === song.id ? (
                      <Input 
                        value={songData.youtube_url} 
                        onChange={e => setSongData({...songData, youtube_url: e.target.value})} 
                      />
                    ) : (
                      song.youtube_url
                    )}
                  </TableCell>
                  <TableCell>
                    {editingSong === song.id ? (
                      <Input 
                        type="number"
                        value={songData.preview_start_seconds} 
                        onChange={e => setSongData({...songData, preview_start_seconds: Number(e.target.value)})} 
                      />
                    ) : (
                      song.preview_start_seconds || 0
                    )}
                  </TableCell>
                  <TableCell>
                    {editingSong === song.id ? (
                      <Input 
                        type="number"
                        value={songData.preview_duration_seconds} 
                        onChange={e => setSongData({...songData, preview_duration_seconds: Number(e.target.value)})} 
                      />
                    ) : (
                      song.preview_duration_seconds || 30
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingSong === song.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(song.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEditing(song)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteSong(song.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
