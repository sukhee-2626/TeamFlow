import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  ArrowLeft, 
  Copy, 
  Check,
  Plus,
  Users,
  Settings,
  Loader2,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceDetails } from "@/hooks/useWorkspace";
import { useTasks } from "@/hooks/useTasks";
import { MembersList } from "@/components/workspace/MembersList";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    workspace, 
    members, 
    userRole, 
    isLoading, 
    isManager,
    updateMemberRole,
    removeMember
  } = useWorkspaceDetails(id || "");
  const { 
    tasks, 
    isLoading: tasksLoading, 
    createTask, 
    updateTaskStatus,
    deleteTask
  } = useTasks(id || "");
  
  const [copied, setCopied] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const copyTeamCode = () => {
    if (workspace?.team_code) {
      navigator.clipboard.writeText(workspace.team_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Team code copied to clipboard" });
    }
  };

  const handleUpdateRole = async (memberId: string, role: 'manager' | 'worker') => {
    const { error } = await updateMemberRole(memberId, role);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Member role updated" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await removeMember(memberId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Member removed from workspace" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await deleteTask(taskId);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Workspace not found</h2>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const ongoingCount = tasks.filter(t => t.status === 'ongoing').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <LayoutGrid className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{workspace.name}</span>
            </div>
            <Badge variant={isManager ? "default" : "secondary"} className="capitalize">
              <Shield className="h-3 w-3 mr-1" />
              {userRole}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground">Team Code:</span>
              <span className="font-mono text-sm font-medium">{workspace.team_code}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyTeamCode}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-2xl font-bold text-foreground">{todoCount}</p>
            <p className="text-sm text-muted-foreground">To Do</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-2xl font-bold text-warning">{ongoingCount}</p>
            <p className="text-sm text-muted-foreground">Ongoing</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-2xl font-bold text-success">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members ({members.length})
              </TabsTrigger>
              {isManager && (
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            {isManager && (
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>

          <TabsContent value="tasks" className="mt-6">
            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <KanbanBoard
                tasks={tasks}
                isManager={isManager}
                currentUserId={user.id}
                onUpdateStatus={updateTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Share the team code <span className="font-mono font-medium">{workspace.team_code}</span> to invite members
                  </p>
                </div>
                <Button variant="outline" onClick={copyTeamCode}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Code
                </Button>
              </div>
              <MembersList
                members={members}
                currentUserId={user.id}
                isManager={isManager}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          </TabsContent>

          {isManager && (
            <TabsContent value="settings" className="mt-6">
              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Workspace Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Workspace Name</label>
                    <p className="text-muted-foreground">{workspace.name}</p>
                  </div>
                  {workspace.description && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <p className="text-muted-foreground">{workspace.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-foreground">Team Code</label>
                    <p className="font-mono text-foreground">{workspace.team_code}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        members={members}
        onSubmit={createTask}
      />
    </div>
  );
}
