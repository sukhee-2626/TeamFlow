import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { WorkspaceMember, TaskVisibility, TaskStatus } from "@/types/database";

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: WorkspaceMember[];
  initialStatus?: TaskStatus;
  onSubmit: (
    title: string,
    description: string,
    deadline: Date,
    visibility: TaskVisibility,
    assignedUserId: string | null
  ) => Promise<{ error?: string }>;
}

export function QuickTaskDialog({ 
  open, 
  onOpenChange, 
  members, 
  initialStatus = 'todo',
  onSubmit 
}: QuickTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [visibility, setVisibility] = useState<TaskVisibility>("public");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    setIsLoading(true);
    const { error } = await onSubmit(
      title.trim(),
      description.trim(),
      new Date(deadline),
      visibility,
      assignedUserId || null
    );
    setIsLoading(false);

    if (!error) {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setVisibility("public");
    setAssignedUserId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as TaskVisibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public
                      </span>
                    </SelectItem>
                    <SelectItem value="private">
                      <span className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
              <Select value={assignedUserId || "unassigned"} onValueChange={(v) => setAssignedUserId(v === "unassigned" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.filter(m => m.user_id).map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profile?.name || member.profile?.email || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !deadline}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
