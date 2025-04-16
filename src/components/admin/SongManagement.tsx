
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Trash, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Song } from "@/types/music";

const SongManagement = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    preview_start_seconds: 0,
    preview_duration_seconds: 30
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true });
        
      if (error) throw error;
      
      setSongs(data || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
      toast({
        title: "Error",
        description: "Failed to load song library",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string => {
    // Handle different YouTube URL formats
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      // If URL is invalid or already just the video ID
      if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
        return url;
      }
    }
    return '';
  };

  const formatYoutubeUrl = (input: string): string => {
    const videoId = extractVideoId(input);
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return input;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes('seconds') ? parseInt(value) || 0 : value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      youtube_url: '',
      preview_start_seconds: 0,
      preview_duration_seconds: 30
    });
    setEditingSong(null);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.youtube_url) {
      toast({
        title: "Missing Information",
        description: "Please enter both a title and YouTube URL",
        variant: "destructive"
      });
      return;
    }

    const songData = {
      title: formData.title,
      youtube_url: formatYoutubeUrl(formData.youtube_url),
      preview_start_seconds: formData.preview_start_seconds,
      preview_duration_seconds: formData.preview_duration_seconds
    };

    try {
      if (editingSong) {
        // Update existing song
        const { error } = await supabase
          .from('songs')
          .update(songData)
          .eq('id', editingSong.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Song updated successfully",
        });
      } else {
        // Add new song
        const { error } = await supabase
          .from('songs')
          .insert([songData]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Song added successfully",
        });
      }
      
      fetchSongs();
      resetForm();
    } catch (error) {
      console.error("Error saving song:", error);
      toast({
        title: "Error",
        description: "Failed to save song",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      youtube_url: song.youtube_url,
      preview_start_seconds: song.preview_start_seconds,
      preview_duration_seconds: song.preview_duration_seconds
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Song deleted successfully",
      });
      
      fetchSongs();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Song Library Management</h3>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          variant={isAdding ? "outline" : "default"}
        >
          {isAdding ? "Cancel" : "Add New Song"}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Song Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter song title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube Video ID or URL</Label>
                  <Input
                    id="youtube_url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleInputChange}
                    placeholder="e.g. dQw4w9WgXcQ or full URL"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview_start_seconds">Preview Start Time (seconds)</Label>
                  <Input
                    id="preview_start_seconds"
                    name="preview_start_seconds"
                    type="number"
                    min="0"
                    value={formData.preview_start_seconds}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preview_duration_seconds">Preview Duration (seconds)</Label>
                  <Input
                    id="preview_duration_seconds"
                    name="preview_duration_seconds"
                    type="number"
                    min="10"
                    value={formData.preview_duration_seconds}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">
                  {editingSong ? "Update Song" : "Add Song"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No songs in the library yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => (
            <Card key={song.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{song.title}</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {song.youtube_url}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(song)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(song.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongManagement;
