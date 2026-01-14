import { useState } from "react";
import { Task, TaskVisibility, TaskStatus, WorkspaceMember } from "@/types/database";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react/dist/esm/icons/calendar";
import { Eye } from "lucide-react/dist/esm/icons/eye";
import { EyeOff } from "lucide-react/dist/esm/icons/eye-off";
import { GripVertical } from "lucide-react/dist/esm/icons/grip-vertical";
import { Trash2 } from "lucide-react/dist/esm/icons/trash-2";
import { Pencil } from "lucide-react/dist/esm/icons/pencil";
import { ArrowRight } from "lucide-react/dist/esm/icons/arrow-right";
import { Check } from "lucide-react/dist/esm/icons/check";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditTaskDialog } from "./EditTaskDialog";

interface TaskCardProps {
  task: Task;
  isManager: boolean;
  currentUserId: string;
  members?: WorkspaceMember[];
  onDelete?: (taskId: string) => void;
  onUpdate?: (taskId: string, updates: {
    title: string;
    description: string | null;
    deadline: string;
    visibility: TaskVisibility;
    assigned_user_id: string | null;
  }) => Promise<{ error?: string }>;
  onStatusChange?: (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => Promise<{ error?: string }>;
}

export function TaskCard({ task, isManager, currentUserId, members = [], onDelete, onUpdate, onStatusChange }: TaskCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !isManager && task.assigned_user_id !== currentUserId
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && task.status !== 'completed';
  const isDueSoon = !isOverdue && (isToday(deadline) || isTomorrow(deadline));

  const getDeadlineColor = () => {
    if (task.status === 'completed') return 'text-green-600';
    if (isOverdue) return 'text-destructive';
    if (isDueSoon) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const canInteract = isManager || task.assigned_user_id === currentUserId;

  const handleEditSubmit = async (taskId: string, updates: {
    title: string;
    description: string | null;
    deadline: string;
    visibility: TaskVisibility;
    assigned_user_id: string | null;
  }) => {
    if (onUpdate) {
      return await onUpdate(taskId, updates);
    }
    return { error: 'Update not available' };
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange || isUpdating) return;
    setIsUpdating(true);
    await onStatusChange(task.id, newStatus, task.status);
    setIsUpdating(false);
  };

  const getNextStatus = (): { status: TaskStatus; label: string } | null => {
    if (task.status === 'todo') return { status: 'ongoing', label: 'Start' };
    if (task.status === 'ongoing') return { status: 'completed', label: 'Complete' };
    return null;
  };

  const getPrevStatus = (): { status: TaskStatus; label: string } | null => {
    if (task.status === 'ongoing') return { status: 'todo', label: 'Back to To Do' };
    if (task.status === 'completed') return { status: 'ongoing', label: 'Reopen' };
    return null;
  };

  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-card border border-border rounded-lg p-4 shadow-sm",
          isDragging && "opacity-50 rotate-2 shadow-lg",
          canInteract && "cursor-grab active:cursor-grabbing",
          !canInteract && "opacity-75"
        )}
      >
        <div className="flex items-start gap-2">
          {canInteract && (
            <div
              {...attributes}
              {...listeners}
              className="mt-1 text-muted-foreground hover:text-foreground cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-foreground line-clamp-2">{task.title}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {task.visibility === 'private' ? (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {isManager && onUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {isManager && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className={cn("flex items-center gap-1 text-xs", getDeadlineColor())}>
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {isOverdue && task.status !== 'completed' && "Overdue: "}
                  {format(deadline, 'MMM d, h:mm a')}
                </span>
              </div>

              {task.assigned_user && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {(task.assigned_user.name || task.assigned_user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                    {task.assigned_user.name || task.assigned_user.email}
                  </span>
                </div>
              )}
            </div>

            {/* Status Change Buttons */}
            {canInteract && onStatusChange && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {prevStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(prevStatus.status);
                    }}
                    disabled={isUpdating}
                  >
                    {prevStatus.label}
                  </Button>
                )}
                {nextStatus && (
                  <Button
                    variant="default"
                    size="sm"
                    className={cn(
                      "h-7 text-xs ml-auto",
                      nextStatus.status === 'completed' && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(nextStatus.status);
                    }}
                    disabled={isUpdating}
                  >
                    {nextStatus.status === 'ongoing' && <ArrowRight className="h-3 w-3 mr-1" />}
                    {nextStatus.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                    {nextStatus.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isManager && (
        <EditTaskDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          task={task}
          members={members}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  );
}
