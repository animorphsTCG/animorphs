
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Song } from '@/types/music';
import { SongForm } from '@/types/songs';
import { extractVideoId } from '@/utils/youtubeUtils';

interface SongFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  songForm: SongForm;
  setSongForm: (form: SongForm) => void;
  editingSong: Song | null;
  mode: 'add' | 'edit';
}

export const SongFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  songForm,
  setSongForm,
  editingSong,
  mode
}: SongFormDialogProps) => {
  const title = mode === 'add' ? 'Add New Song' : 'Edit Song';
  const submitText = mode === 'add' ? 'Add Song' : 'Save Changes';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
            {mode === 'edit' && editingSong && (
              <p className="text-xs text-muted-foreground">
                Current video ID: {extractVideoId(editingSong.youtube_url)}
              </p>
            )}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
