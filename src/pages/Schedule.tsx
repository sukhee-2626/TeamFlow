import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import {
  ArrowLeft, CalendarDays, Plus, Trash2, Loader2, CheckCircle2,
  Circle, Clock, Flag, Briefcase, ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  usePersonalTasks, useAssignedWorkspaceTasks,
  type PersonalTask, type PersonalTaskPriority,
} from "@/hooks/usePersonalTasks";

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
  const { tasks, isLoading, createTask, toggleComplete, deleteTask } = usePersonalTasks();
  const { tasks: assigned, isLoading: assignedLoading } = useAssignedWorkspaceTasks();
  const [open, setOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background page-transition">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold leading-tight">My Schedule</h1>
                <p className="text-xs text-muted-foreground">Your personal to-dos & assigned work</p>
              </div>
            </div>
          </div>
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
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <Tabs defaultValue="personal">
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="gap-2">
              <ListTodo className="h-4 w-4" />Personal ({tasks.filter(t => t.status !== 'completed').length})
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
    </div>
  );
}