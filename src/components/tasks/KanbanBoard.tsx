import { Task, TaskStatus } from "@/types/database";
import { TaskCard } from "./TaskCard";
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
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  isManager: boolean;
  currentUserId: string;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => Promise<{ error?: string }>;
  onDeleteTask: (taskId: string) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-muted' },
  { id: 'ongoing', title: 'Ongoing', color: 'bg-warning/10' },
  { id: 'completed', title: 'Completed', color: 'bg-success/10' },
];

function DroppableColumn({ 
  id, 
  title, 
  color, 
  tasks, 
  isManager, 
  currentUserId,
  onDeleteTask,
}: { 
  id: TaskStatus; 
  title: string; 
  color: string; 
  tasks: Task[];
  isManager: boolean;
  currentUserId: string;
  onDeleteTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={cn(
        "rounded-xl p-4 min-h-[500px] transition-colors",
        color,
        isOver && "ring-2 ring-primary"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="text-sm text-muted-foreground bg-background rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>

        <div ref={setNodeRef} className="space-y-3">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isManager={isManager}
                currentUserId={currentUserId}
                onDelete={isManager ? onDeleteTask : undefined}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({ 
  tasks, 
  isManager, 
  currentUserId, 
  onUpdateStatus,
  onDeleteTask
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    // Determine target column
    let targetStatus: TaskStatus | null = null;

    // Check if dropped over a column
    if (columns.some(c => c.id === over.id)) {
      targetStatus = over.id as TaskStatus;
    } else {
      // Dropped over another task - find its column
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && targetStatus !== task.status) {
      // Check if user can update this task
      const canUpdate = isManager || task.assigned_user_id === currentUserId;
      if (!canUpdate) return;

      const { error } = await onUpdateStatus(taskId, targetStatus, task.status);
      if (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={getTasksByStatus(column.id)}
            isManager={isManager}
            currentUserId={currentUserId}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard 
            task={activeTask} 
            isManager={isManager}
            currentUserId={currentUserId}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
