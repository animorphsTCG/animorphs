
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { Song } from "@/types/music";

const SongManagement = () => {
  const { isAdmin } = useAdmin();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songForm, setSongForm] = useState({
    title: '',
    videoId: '',
    previewStart: 0,
    previewDuration: 30
  });

  useEffect(() => {
    if (!isAdmin) return;
    fetchSongs();
  }, [isAdmin]);

  const fetchSongs = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the admin edge function to fetch songs data
      const { data: adminData, error: adminError } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'fetch_songs' }
      });
      
      if (adminError) {
        console.error("Admin function error:", adminError);
        setError("Failed to call admin function");
        throw adminError;
      }

      if (adminData?.error) {
        console.error("Songs fetch error:", adminData.error);
        setError(`Error: ${adminData.error}`);
        throw new Error(adminData.error);
      }

      if (adminData?.data) {
        setSongs(adminData.data);
      } else {
        setError("No songs data returned");
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError(error.message || "Failed to load songs");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load songs"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return url; // Assume it's already a video ID
    }
    
    // Handle youtube.com URL format
    if (url.includes('youtube.com/watch?v=')) {
      const params = new URLSearchParams(url.split('?')[1]);
      return params.get('v') || '';
    }
    
    // Handle youtu.be URL format
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }
    
    return '';
  };

  const buildYouTubeUrl = (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  const handleAddSong = async () => {
    try {
      if (!songForm.title.trim() || !songForm.videoId.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Title and Video ID are required."
        });
        return;
      }
      
      const videoId = extractVideoId(songForm.videoId);
      const youtubeUrl = buildYouTubeUrl(videoId);
      
      const { error } = await supabase.from('songs').insert({
        title: songForm.title,
        youtube_url: youtubeUrl,
        preview_start_seconds: songForm.previewStart,
        preview_duration_seconds: songForm.previewDuration
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Song added successfully."
      });
      
      setIsAddDialogOpen(false);
      setSongForm({
        title: '',
        videoId: '',
        previewStart: 0,
        previewDuration: 30
      });
      
      fetchSongs();
    } catch (error) {
      console.error('Error adding song:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add song."
      });
    }
  };

  const handleEditSong = async () => {
    try {
      if (!editingSong || !songForm.title.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Song title is required."
        });
        return;
      }
      
      let youtubeUrl = editingSong.youtube_url;
      if (songForm.videoId) {
        const videoId = extractVideoId(songForm.videoId);
        youtubeUrl = buildYouTubeUrl(videoId);
      }
      
      const { error } = await supabase
        .from('songs')
        .update({
          title: songForm.title,
          youtube_url: youtubeUrl,
          preview_start_seconds: songForm.previewStart,
          preview_duration_seconds: songForm.previewDuration
        })
        .eq('id', editingSong.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Song updated successfully."
      });
      
      setIsEditDialogOpen(false);
      setEditingSong(null);
      fetchSongs();
    } catch (error) {
      console.error('Error updating song:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update song."
      });
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      if (confirm('Are you sure you want to delete this song?')) {
        const { error } = await supabase
          .from('songs')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Song deleted successfully."
        });
        
        fetchSongs();
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete song."
      });
    }
  };

  const openEditDialog = (song: Song) => {
    const videoId = extractVideoId(song.youtube_url);
    setEditingSong(song);
    setSongForm({
      title: song.title,
      videoId: videoId,
      previewStart: song.preview_start_seconds,
      previewDuration: song.preview_duration_seconds
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Song Library</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchSongs}>Try Again</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>YouTube Link</TableHead>
                  <TableHead>Preview Start</TableHead>
                  <TableHead>Preview Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songs.length > 0 ? (
                  songs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell>
                        <a 
                          href={song.youtube_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {extractVideoId(song.youtube_url)}
                        </a>
                      </TableCell>
                      <TableCell>{song.preview_start_seconds}s</TableCell>
                      <TableCell>{song.preview_duration_seconds}s</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(song)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteSong(song.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No songs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Song Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="song-title">Song Title</Label>
              <Input
                id="song-title"
                value={songForm.title}
                onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                placeholder="Enter song title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-id">YouTube Video ID</Label>
              <Input
                id="video-id"
                value={songForm.videoId}
                onChange={(e) => setSongForm({ ...songForm, videoId: e.target.value })}
                placeholder="e.g., Otzj9m_PAfY"
              />
              <p className="text-xs text-muted-foreground">
                Enter the video ID from a YouTube URL (e.g., for https://www.youtube.com/watch?v=Otzj9m_PAfY, enter "Otzj9m_PAfY")
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preview-start">Preview Start (seconds)</Label>
                <Input
                  id="preview-start"
                  type="number"
                  min="0"
                  value={songForm.previewStart}
                  onChange={(e) => setSongForm({ ...songForm, previewStart: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-duration">Preview Duration (seconds)</Label>
                <Input
                  id="preview-duration"
                  type="number"
                  min="1"
                  value={songForm.previewDuration}
                  onChange={(e) => setSongForm({ ...songForm, previewDuration: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSong}>
              Add Song
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Song Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-song-title">Song Title</Label>
              <Input
                id="edit-song-title"
                value={songForm.title}
                onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-video-id">YouTube Video ID</Label>
              <Input
                id="edit-video-id"
                value={songForm.videoId}
                onChange={(e) => setSongForm({ ...songForm, videoId: e.target.value })}
                placeholder="Leave blank to keep current URL"
              />
              <p className="text-xs text-muted-foreground">
                Current video ID: {editingSong && extractVideoId(editingSong.youtube_url)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-preview-start">Preview Start (seconds)</Label>
                <Input
                  id="edit-preview-start"
                  type="number"
                  min="0"
                  value={songForm.previewStart}
                  onChange={(e) => setSongForm({ ...songForm, previewStart: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-preview-duration">Preview Duration (seconds)</Label>
                <Input
                  id="edit-preview-duration"
                  type="number"
                  min="1"
                  value={songForm.previewDuration}
                  onChange={(e) => setSongForm({ ...songForm, previewDuration: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSong}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SongManagement;
