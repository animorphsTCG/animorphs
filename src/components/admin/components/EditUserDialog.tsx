
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: {
    hasPaid: boolean;
    musicUnlocked: boolean;
  };
  onEditDataChange: (data: { hasPaid: boolean; musicUnlocked: boolean }) => void;
  onSave: () => void;
}

export const EditUserDialog = ({
  open,
  onOpenChange,
  editData,
  onEditDataChange,
  onSave
}: EditUserDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-paid">Game Access (Paid Status)</Label>
            <Switch
              id="has-paid"
              checked={editData.hasPaid}
              onCheckedChange={(checked) => 
                onEditDataChange({ ...editData, hasPaid: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="music-unlocked">Music Unlocked</Label>
            <Switch
              id="music-unlocked"
              checked={editData.musicUnlocked}
              onCheckedChange={(checked) => 
                onEditDataChange({ ...editData, musicUnlocked: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
