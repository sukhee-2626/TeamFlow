import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JoinWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamCode: string) => Promise<{ error?: string; data?: any }>;
}

export function JoinWorkspaceDialog({ open, onOpenChange, onSubmit }: JoinWorkspaceDialogProps) {
  const [teamCode, setTeamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;

    setIsLoading(true);
    const { error } = await onSubmit(teamCode.trim());
    setIsLoading(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "You have joined the workspace!" });
      setTeamCode("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Workspace
            </DialogTitle>
            <DialogDescription>
              Enter the team code shared by your workspace manager to join.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamCode">Team Code</Label>
              <Input
                id="teamCode"
                placeholder="e.g., abc12345"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="text-center text-lg tracking-wider font-mono"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !teamCode.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Join Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
