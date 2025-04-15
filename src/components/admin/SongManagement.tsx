
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Song } from '@/types/music';
import { SongForm } from '@/types/songs';
import { extractVideoId, buildYouTubeUrl } from '@/utils/youtubeUtils';
import { SongTable } from './components/SongTable';
import { SongFormDialog } from './components/SongFormDialog';

const SongManagement = () => {
  const { isAdmin } = useAdmin();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songForm, setSongForm] = useState<SongForm>({
    title: '',
    videoId: '',
    previewStart: 0,
    previewDuration: 30
  });

  useEffect(() => {
    if (!isAdmin) return;
    
    const channel = supabase
      .channel('songs_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'songs' 
        }, 
        () => {
          fetchSongs();
        }
      )
      .subscribe();

    fetchSongs();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchSongs = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title');
        
      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load songs"
      });
    } finally {
      setLoading(false);
    }
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
          <SongTable
            songs={songs}
            onEdit={openEditDialog}
            onDelete={handleDeleteSong}
            loading={loading}
          />
        </CardContent>
      </Card>

      <SongFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSong}
        songForm={songForm}
        setSongForm={setSongForm}
        editingSong={null}
        mode="add"
      />

      <SongFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSong}
        songForm={songForm}
        setSongForm={setSongForm}
        editingSong={editingSong}
        mode="edit"
      />
    </div>
  );
};

export default SongManagement;
