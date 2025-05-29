import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
}
export const PasswordDialog = ({
  open,
  onOpenChange,
  onAuthenticated
}: PasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check password
    if (password === "Adanacia23.") {
      toast({
        title: "Access Granted",
        description: "Welcome to the AI Development Assistant"
      });
      onAuthenticated();
      onOpenChange(false);
      setPassword("");
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/90 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Lock className="h-5 w-5 text-yellow-400" />
            AI Assistant Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-gray-300">
              Enter development password:
            </label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="bg-black/50 border-white/20 text-white" autoFocus />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 text-white border-white/20 bg-sky-600 hover:bg-sky-500">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !password} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              {isLoading ? "Checking..." : "Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};