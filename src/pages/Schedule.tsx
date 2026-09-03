import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, isSameDay, parseISO } from "date-fns";
import {
  CalendarDays, Plus, Trash2, Loader2, CheckCircle2,
  Circle, Clock, Flag, Briefcase, ListTodo, KanbanSquare, ArrowLeftCircle, ArrowRightCircle,
  GripVertical, Pencil, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  usePersonalTasks, useAssignedWorkspaceTasks,
  type PersonalTask, type PersonalTaskPriority, type PersonalTaskStatus,
} from "@/hooks/usePersonalTasks";
import { usePersonalStages, STAGE_COLORS, colorFor, type PersonalStage } from "@/hooks/usePersonalStages";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

const priorityColor: Record<PersonalTaskPriority, string> = {
  low: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  high: "bg-red-500/15 text-red-600 border-red-500/30",
};

function formatWhen(iso: string | null) {
  if (!iso) return "No date";
  const d = parseISO(iso);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

export default function Schedule() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask } = usePersonalTasks();
  const { tasks: assigned, isLoading: assignedLoading } = useAssignedWorkspaceTasks();
  const { stages, createStage, updateStage, deleteStage, reorderStages } = usePersonalStages();
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [manageOpen, setManageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("slate");

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PersonalTaskPriority>("medium");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const grouped = useMemo(() => {
    const overdue: PersonalTask[] = [];
    const today: PersonalTask[] = [];
    const upcoming: PersonalTask[] = [];
    const someday: PersonalTask[] = [];
    const done: PersonalTask[] = [];
    for (const t of tasks) {
      if (t.status === "completed") { done.push(t); continue; }
      if (!t.scheduled_at) { someday.push(t); continue; }
      const d = parseISO(t.scheduled_at);
      if (isToday(d)) today.push(t);
      else if (isPast(d)) overdue.push(t);
      else upcoming.push(t);
    }
    return { overdue, today, upcoming, someday, done };
  }, [tasks]);

  // Group tasks by custom stage. Tasks without a stage_id fall back by legacy status.
  const tasksByStage = useMemo(() => {
    const map: Record<string, PersonalTask[]> = {};
    stages.forEach(s => { map[s.id] = []; });
    const firstTodo = stages.find(s => !s.is_done) ?? stages[0];
    const firstDone = stages.find(s => s.is_done);
    const inProgress = stages.find(s => /progress|ongoing|doing/i.test(s.name)) ?? firstTodo;
    for (const t of tasks) {
      let target: PersonalStage | undefined;
      if (t.stage_id && map[t.stage_id]) target = stages.find(s => s.id === t.stage_id);
      else if (t.status === 'completed') target = firstDone ?? firstTodo;
      else if (t.status === 'ongoing') target = inProgress;
      else target = firstTodo;
      if (target) map[target.id].push(t);
    }
    return map;
  }, [tasks, stages]);

  // Calendar: tasks for the selected day + day-marker set
  const scheduledDays = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.scheduled_at) set.add(format(parseISO(t.scheduled_at), 'yyyy-MM-dd'));
    });
    return set;
  }, [tasks]);

  const dayTasks = useMemo(() =>
    tasks.filter(t => t.scheduled_at && isSameDay(parseISO(t.scheduled_at), selectedDay))
  , [tasks, selectedDay]);

  const submit = async () => {
    if (!title.trim()) return;
    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    });
    setTitle(""); setDescription(""); setPriority("medium"); setScheduledAt("");
    setOpen(false);
  };

  const moveToStage = (t: PersonalTask, stage: PersonalStage) => {
    const status: PersonalTaskStatus = stage.is_done
      ? 'completed'
      : stages[0]?.id === stage.id ? 'todo' : 'ongoing';
    return updateTask(t.id, {
      stage_id: stage.id,
      status,
      completed_at: stage.is_done ? new Date().toISOString() : null,
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onStageDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = stages.map(s => s.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    reorderStages(arrayMove(ids, oldIdx, newIdx));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderTask = (t: PersonalTask) => (
    <Card key={t.id} className="p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
      <button
        onClick={() => toggleComplete(t)}
        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Toggle complete"
      >
        {t.status === "completed"
          ? <CheckCircle2 className="h-5 w-5 text-success" />
          : <Circle className="h-5 w-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
            {t.title}
          </h3>
          <Badge variant="outline" className={priorityColor[t.priority]}>
            <Flag className="h-3 w-3 mr-1" />{t.priority}
          </Badge>
        </div>
        {t.description && (
          <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatWhen(t.scheduled_at)}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );

  const Section = ({ title, items }: { title: string; items: PersonalTask[] }) =>
    items.length === 0 ? null : (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          {title} <span className="text-xs">({items.length})</span>
        </h2>
        <div className="space-y-2">{items.map(renderTask)}</div>
      </div>
    );

  const KanbanCard = ({ t, prev, next }: { t: PersonalTask; prev?: PersonalStage; next?: PersonalStage }) => (
    <Card className="p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-snug">{t.title}</h4>
        <Badge variant="outline" className={priorityColor[t.priority]}>
          <Flag className="h-3 w-3 mr-1" />{t.priority}
        </Badge>
      </div>
      {t.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />{formatWhen(t.scheduled_at)}
        </span>
      </div>
      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
        {prev && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
            onClick={() => moveToStage(t, prev)} title={`Move to ${prev.name}`}>
            <ArrowLeftCircle className="h-3.5 w-3.5 mr-1" />{prev.name}
          </Button>
        )}
        {next && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs ml-auto"
            onClick={() => moveToStage(t, next)} title={`Move to ${next.name}`}>
            {next.name}
            <ArrowRightCircle className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTask(t.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );

  const SortableKanbanColumn = ({ stage, items, prev, next }: {
    stage: PersonalStage; items: PersonalTask[]; prev?: PersonalStage; next?: PersonalStage;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: stage.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };
    const c = colorFor(stage.color);
    return (
      <div ref={setNodeRef} style={style} className="flex-shrink-0 w-[280px]">
        <div className={`rounded-xl p-3 min-h-[400px] ${c.tint}`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <button {...attributes} {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                aria-label="Reorder stage">
                <GripVertical className="h-4 w-4" />
              </button>
              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
              <h4 className="font-semibold text-sm truncate">{stage.name}</h4>
            </div>
            <Badge variant="secondary" className="h-5 px-2 text-xs">{items.length}</Badge>
          </div>
          <div className="space-y-2">
            {items.map(t => <KanbanCard key={t.id} t={t} prev={prev} next={next} />)}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-wallpaper page-transition">
      <AppHeader
        title="My Schedule"
        subtitle="Personal planning and assigned work"
        backTo="/dashboard"
        backLabel="Back to dashboard"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Personal Task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Schedule</label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as PersonalTaskPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={!title.trim()}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <main className="container py-8 max-w-3xl">
        <Tabs defaultValue="personal">
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="gap-2">
              <ListTodo className="h-4 w-4" />Personal ({tasks.filter(t => t.status !== 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <KanbanSquare className="h-4 w-4" />My Workflow
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />Calendar
            </TabsTrigger>
            <TabsTrigger value="assigned" className="gap-2">
              <Briefcase className="h-4 w-4" />Assigned to me ({assigned.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : tasks.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No personal tasks yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start planning your day — add a task to get going.</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add your first task</Button>
              </Card>
            ) : (
              <>
                <Section title="Overdue" items={grouped.overdue} />
                <Section title="Today" items={grouped.today} />
                <Section title="Upcoming" items={grouped.upcoming} />
                <Section title="Someday" items={grouped.someday} />
                <Section title="Completed" items={grouped.done} />
              </>
            )}
          </TabsContent>

          <TabsContent value="kanban">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">
                    Drag the handle to reorder stages. Click <Settings2 className="inline h-3 w-3" /> to customize.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
                    <Settings2 className="h-4 w-4 mr-2" />Customize stages
                  </Button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onStageDragEnd}>
                  <SortableContext items={stages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {stages.map((stage, i) => (
                        <SortableKanbanColumn
                          key={stage.id}
                          stage={stage}
                          items={tasksByStage[stage.id] || []}
                          prev={stages[i - 1]}
                          next={stages[i + 1]}
                        />
                      ))}
                      <div className="flex-shrink-0 w-[280px]">
                        <button
                          onClick={() => setManageOpen(true)}
                          className="w-full h-full min-h-[120px] rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-colors flex items-center justify-center text-sm text-muted-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />Add stage
                        </button>
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid md:grid-cols-[auto_1fr] gap-6">
              <Card className="p-3 w-fit">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(d) => d && setSelectedDay(d)}
                  modifiers={{
                    hasTask: (date) => scheduledDays.has(format(date, 'yyyy-MM-dd')),
                  }}
                  modifiersClassNames={{
                    hasTask: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary',
                  }}
                  className="pointer-events-auto"
                />
              </Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {format(selectedDay, 'EEEE, MMMM d')}
                  </h3>
                  <Badge variant="secondary">{dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}</Badge>
                </div>
                {dayTasks.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
                    <Button size="sm" className="mt-3" onClick={() => {
                      setScheduledAt(format(selectedDay, "yyyy-MM-dd'T'09:00"));
                      setOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-1" />Add task
                    </Button>
                  </Card>
                ) : (
                  dayTasks
                    .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
                    .map(renderTask)
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assigned" className="space-y-2">
            {assignedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : assigned.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No assigned tasks</h3>
                <p className="text-sm text-muted-foreground">Tasks assigned to you across workspaces will appear here.</p>
              </Card>
            ) : (
              assigned.map((t: any) => (
                <Card key={t.id} className="p-4 flex items-start gap-3">
                  <div className="mt-1"><Briefcase className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{t.title}</h3>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                    {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.deadline ? format(parseISO(t.deadline), "MMM d, h:mm a") : "No deadline"}
                      </span>
                      {t.workspace?.name && (
                        <Link to={`/workspace/${t.workspace.id}`} className="hover:text-primary transition-colors">
                          in {t.workspace.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Customize workflow stages</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {stages.map((s) => {
              const c = colorFor(s.color);
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                  <Input
                    value={s.name}
                    onChange={(e) => updateStage(s.id, { name: e.target.value })}
                    className="h-8 flex-1"
                  />
                  <Select value={s.color} onValueChange={(v) => updateStage(s.id, { color: v })}>
                    <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGE_COLORS.map(col => (
                        <SelectItem key={col.id} value={col.id}>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${col.dot}`} />{col.id}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={s.is_done ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => updateStage(s.id, { is_done: !s.is_done })}
                    title="Marks tasks as completed"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => {
                      if (stages.length <= 1) return;
                      if (confirm(`Delete "${s.name}"? Tasks in it will be unassigned from any stage.`)) {
                        deleteStage(s.id);
                      }
                    }}
                    disabled={stages.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              placeholder="New stage name"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              className="h-9 flex-1"
            />
            <Select value={newStageColor} onValueChange={setNewStageColor}>
              <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGE_COLORS.map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.dot}`} />{col.id}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={async () => {
                if (!newStageName.trim()) return;
                await createStage({ name: newStageName.trim(), color: newStageColor });
                setNewStageName(""); setNewStageColor("slate");
              }}
              disabled={!newStageName.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />Add
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setManageOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}