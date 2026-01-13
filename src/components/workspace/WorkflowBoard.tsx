import { useState } from "react";
import { Workflow, Task, TaskStatus, WorkspaceMember } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { QuickTaskDialog } from "./QuickTaskDialog";

interface WorkflowBoardProps {
  workflow: Workflow;
  tasks: Task[];
  members: WorkspaceMember[];
  isManager: boolean;
  currentUserId: string;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => Promise<{ error?: string }>;
  onCreateTask: (
    title: string,
    description: string,
    deadline: Date,
    visibility: 'public' | 'private',
    assignedUserId: string | null,
    workflowId: string
  ) => Promise<{ error?: string }>;
  onDeleteWorkflow: () => void;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'ongoing', title: 'In Progress' },
  { id: 'completed', title: 'Done' },
];

function TaskItem({ task, isManager, currentUserId }: { task: Task; isManager: boolean; currentUserId: string }) {
  const canDrag = isManager || task.assigned_user_id === currentUserId;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !canDrag
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      className={cn(
        "bg-background border border-border rounded-lg p-3 shadow-soft",
        isDragging && "opacity-50",
        canDrag && "cursor-grab active:cursor-grabbing"
      )}
    >
      <p className="font-medium text-foreground text-sm mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
      )}
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs",
            isOverdue && task.status !== 'completed' && "border-destructive text-destructive",
            task.status === 'completed' && "border-success text-success"
          )}
        >
          <Calendar className="h-3 w-3 mr-1" />
          {format(deadline, 'MMM d')}
        </Badge>
      </div>
    </div>
  );
}

function Column({ 
  status, 
  title, 
  tasks, 
  isManager,
  currentUserId,
  onAddTask
}: { 
  status: TaskStatus; 
  title: string; 
  tasks: Task[];
  isManager: boolean;
  currentUserId: string;
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const count = tasks.length;

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={cn(
        "rounded-xl p-3 min-h-[400px] transition-colors",
        status === 'todo' && "bg-muted/50",
        status === 'ongoing' && "bg-warning/5",
        status === 'completed' && "bg-success/5",
        isOver && "ring-2 ring-primary"
      )}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <Badge variant="secondary" className="rounded-full h-5 px-2 text-xs">
              {count}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sort by deadline</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div ref={setNodeRef} className="space-y-2">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                isManager={isManager}
                currentUserId={currentUserId}
              />
            ))}
          </SortableContext>
        </div>

        {isManager && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
}

export function WorkflowBoard({ 
  workflow,
  tasks, 
  members,
  isManager, 
  currentUserId, 
  onUpdateStatus,
  onCreateTask,
  onDeleteWorkflow
}: WorkflowBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskStatus, setQuickTaskStatus] = useState<TaskStatus>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let targetStatus: TaskStatus | null = null;

    if (columns.some(c => c.id === over.id)) {
      targetStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && targetStatus !== task.status) {
      const canUpdate = isManager || task.assigned_user_id === currentUserId;
      if (!canUpdate) return;

      await onUpdateStatus(taskId, targetStatus, task.status);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status);

  const handleAddTask = (status: TaskStatus) => {
    setQuickTaskStatus(status);
    setShowQuickTask(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              status={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              isManager={isManager}
              currentUserId={currentUserId}
              onAddTask={() => handleAddTask(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-background border border-border rounded-lg p-3 shadow-elevated">
              <p className="font-medium text-foreground text-sm">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <QuickTaskDialog
        open={showQuickTask}
        onOpenChange={setShowQuickTask}
        members={members}
        initialStatus={quickTaskStatus}
        onSubmit={async (title, description, deadline, visibility, assignedUserId) => {
          return onCreateTask(title, description, deadline, visibility, assignedUserId, workflow.id);
        }}
      />
    </>
  );
}
