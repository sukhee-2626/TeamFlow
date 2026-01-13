import { useState } from "react";
import { Workspace } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkspaceSettingsProps {
  workspace: Workspace;
  onUpdate: (name: string, description: string) => Promise<{ error?: string }>;
}

export function WorkspaceSettings({ workspace, onUpdate }: WorkspaceSettingsProps) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const copyTeamCode = () => {
    navigator.clipboard.writeText(workspace.team_code.toUpperCase());
    setCopied(true);
    toast({ title: "Copied!", description: "Team code copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await onUpdate(name.trim(), description.trim());
    setIsLoading(false);
    
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Workspace updated" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Code */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Team Code</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Share this code with others to let them join your workspace
        </p>
        
        <div className="flex gap-2">
          <Input
            value={workspace.team_code.toUpperCase()}
            readOnly
            className="font-mono text-lg tracking-widest"
          />
          <Button variant="outline" size="icon" onClick={copyTeamCode}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Anyone with this code can join your workspace as a member
        </p>
      </div>

      {/* Workspace Settings */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Workspace Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Update your workspace details
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
