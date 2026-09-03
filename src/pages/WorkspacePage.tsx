import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Plus,
  Users,
  Settings,
  Crown,
  LayoutDashboard,
  Workflow as WorkflowIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceDetails } from "@/hooks/useWorkspace";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useTasks } from "@/hooks/useTasks";
import { MembersList } from "@/components/workspace/MembersList";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { WorkflowBoard } from "@/components/workspace/WorkflowBoard";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import { CreateWorkflowDialog } from "@/components/workspace/CreateWorkflowDialog";
import { WorkspaceChat } from "@/components/workspace/WorkspaceChat";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

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
    removeMember,
    updateWorkspace
  } = useWorkspaceDetails(id || "");
  const { workflows, createWorkflow, deleteWorkflow } = useWorkflows(id || "");
  const { tasks, createTask, updateTaskStatus, updateTask, deleteTask } = useTasks(id || "");
  
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (workflows.length > 0 && !activeWorkflow) {
      setActiveWorkflow(workflows[0].id);
    }
  }, [workflows, activeWorkflow]);

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
      toast({ title: "Success", description: "Member removed" });
    }
  };

  const handleCreateWorkflow = async (name: string) => {
    const { error } = await createWorkflow(name);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return { error };
    }
    toast({ title: "Success", description: "Workflow created" });
    return {};
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-wallpaper flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!workspace || !user) {
    return (
      <div className="min-h-screen bg-wallpaper flex items-center justify-center page-transition">
        <div className="text-center card-glass p-8 animate-scale-in">
          <h2 className="text-xl font-semibold text-foreground mb-4">Workspace not found</h2>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="hover-lift">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentWorkflow = workflows.find(w => w.id === activeWorkflow);
  const workflowTasks = tasks.filter(t => t.workflow_id === activeWorkflow);

  return (
    <div className="flex min-h-screen flex-col bg-wallpaper page-transition">
      <AppHeader
        title={workspace.name}
        subtitle="Team workspace"
        backTo="/dashboard"
        backLabel="Back to dashboard"
        badge={isManager ? (
          <Badge className="border-warning/30 bg-warning/15 text-accent-foreground">
            <Crown className="mr-1 h-3 w-3" />Owner
          </Badge>
        ) : undefined}
        actions={
          <>
            <WorkspaceChat workspaceId={id || ""} workspaceName={workspace.name} members={members} />
            <div className="hidden items-center gap-2 md:flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="max-w-48 truncate text-sm text-muted-foreground">{user.email}</span>
            </div>
          </>
        }
      />

      {/* Main content */}
      <main className="container py-6 relative z-10 animate-slide-up">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <WorkflowIcon className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <WorkspaceDashboard tasks={tasks} currentUserId={user.id} />
          </TabsContent>

          <TabsContent value="workflows">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {workflows.map(wf => (
                    <Button
                      key={wf.id}
                      variant={activeWorkflow === wf.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveWorkflow(wf.id)}
                    >
                      <WorkflowIcon className="h-4 w-4 mr-1" />
                      {wf.name}
                    </Button>
                  ))}
                </div>
                {isManager && (
                  <Button onClick={() => setShowCreateWorkflow(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Workflow
                  </Button>
                )}
              </div>

              {currentWorkflow ? (
                <WorkflowBoard
                  workflow={currentWorkflow}
                  tasks={workflowTasks}
                  members={members}
                  isManager={isManager}
                  currentUserId={user.id}
                  onUpdateStatus={updateTaskStatus}
                  onCreateTask={createTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onDeleteWorkflow={() => deleteWorkflow(currentWorkflow.id)}
                />
              ) : (
                <div className="card-glass p-12 text-center animate-scale-in">
                  <p className="text-muted-foreground mb-4">No workflows yet</p>
                  {isManager && (
                    <Button onClick={() => setShowCreateWorkflow(true)} className="hover-lift">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first workflow
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="card-glass p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                  <p className="text-sm text-muted-foreground">Manage who has access to this workspace</p>
                </div>
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
            <TabsContent value="settings">
              <WorkspaceSettings workspace={workspace} onUpdate={updateWorkspace} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <AppFooter />

      <CreateWorkflowDialog
        open={showCreateWorkflow}
        onOpenChange={setShowCreateWorkflow}
        onSubmit={handleCreateWorkflow}
      />
    </div>
  );
}
