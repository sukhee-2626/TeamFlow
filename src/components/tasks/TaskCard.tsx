import { Task, TaskStatus } from "@/types/database";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isManager: boolean;
  currentUserId: string;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, isManager, currentUserId, onDelete }: TaskCardProps) {
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
    if (task.status === 'completed') return 'text-success';
    if (isOverdue) return 'text-destructive';
    if (isDueSoon) return 'text-warning';
    return 'text-muted-foreground';
  };

  const canInteract = isManager || task.assigned_user_id === currentUserId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border border-border rounded-lg p-4 shadow-soft",
        isDragging && "opacity-50 rotate-2 shadow-elevated",
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

          <div className="flex items-center justify-between">
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
        </div>
      </div>
    </div>
  );
}
