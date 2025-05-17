import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { d1 } from '@/lib/d1Database';
import { toast } from '@/hooks/use-toast';

const SongManagement = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    youtube_id: '',
    preview_start_seconds: 0,
    preview_duration_seconds: 30
  });
  
  useEffect(() => {
    fetchSongs();
  }, []);
  
  const fetchSongs = async () => {
    try {
      setLoading(true);
      
      // Use the D1 database instead of Supabase
      const result = await d1.from('songs')
        .select('*')
        .orderBy('title', 'asc')
        .get();
      
      setSongs(result || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load songs",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openAddDialog = () => {
    setEditingSong(null);
    setForm({
      title: '',
      youtube_id: '',
      preview_start_seconds: 0,
      preview_duration_seconds: 30
    });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (song: any) => {
    setEditingSong(song);
    setForm({
      title: song.title,
      youtube_id: extractVideoId(song.youtube_url),
      preview_start_seconds: song.preview_start_seconds || 0,
      preview_duration_seconds: song.preview_duration_seconds || 30
    });
    setIsDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name.includes('seconds') ? parseFloat(value) : value
    });
  };
  
  const handleSubmit = async () => {
    if (!form.title || !form.youtube_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please complete all required fields",
      });
      return;
    }
    
    try {
      const youtube_url = `https://www.youtube.com/watch?v=${form.youtube_id}`;
      
      if (editingSong) {
        // Update existing song
        await d1.from('songs')
          .update({
            title: form.title,
            youtube_url,
            preview_start_seconds: form.preview_start_seconds,
            preview_duration_seconds: form.preview_duration_seconds
          })
          .where('id', '=', editingSong.id)
          .execute();
        
        toast({
          title: "Success",
          description: "Song updated successfully",
        });
      } else {
        // Add new song
        await d1.from('songs')
          .insert({
            id: crypto.randomUUID(),
            title: form.title,
            youtube_url,
            preview_start_seconds: form.preview_start_seconds,
            preview_duration_seconds: form.preview_duration_seconds
          })
          .execute();
        
        toast({
          title: "Success",
          description: "Song added successfully",
        });
      }
      
      setIsDialogOpen(false);
      fetchSongs();
    } catch (error) {
      console.error('Error saving song:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save song",
      });
    }
  };
  
  const handleDelete = async (songId: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    
    try {
      await d1.from('songs')
        .delete()
        .where('id', '=', songId)
        .execute();
      
      toast({
        title: "Success",
        description: "Song deleted successfully",
      });
      
      fetchSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete song",
      });
    }
  };
  
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      console.error("Invalid URL format:", url);
      return '';
    }
    
    return '';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Song Management</h3>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Song
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading songs...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>YouTube ID</TableHead>
              <TableHead>Preview Start</TableHead>
              <TableHead>Preview Duration</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length > 0 ? (
              songs.map(song => (
                <TableRow key={song.id}>
                  <TableCell>{song.title}</TableCell>
                  <TableCell>{extractVideoId(song.youtube_url)}</TableCell>
                  <TableCell>{song.preview_start_seconds}s</TableCell>
                  <TableCell>{song.preview_duration_seconds}s</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(song)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(song.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No songs available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSong ? 'Edit Song' : 'Add New Song'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title">Song Title</label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Enter song title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="youtube_id">YouTube Video ID</label>
              <Input
                id="youtube_id"
                name="youtube_id"
                value={form.youtube_id}
                onChange={handleInputChange}
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="preview_start_seconds">Preview Start (seconds)</label>
                <Input
                  id="preview_start_seconds"
                  name="preview_start_seconds"
                  type="number"
                  min="0"
                  value={form.preview_start_seconds}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="preview_duration_seconds">Preview Duration (seconds)</label>
                <Input
                  id="preview_duration_seconds"
                  name="preview_duration_seconds"
                  type="number"
                  min="1"
                  value={form.preview_duration_seconds}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingSong ? 'Update' : 'Add'} Song</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SongManagement;
