import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Plus, 
  LogOut, 
  Folder,
  Users,
  Loader2,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { JoinWorkspaceDialog } from "@/components/workspace/JoinWorkspaceDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { workspaces, isLoading: workspacesLoading, createWorkspace, joinWorkspace } = useWorkspaces();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FlowDesk</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="text-foreground font-medium">{userName}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Manage your workspaces and collaborate with your team.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                <Folder className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{workspaces.length}</p>
                <p className="text-sm text-muted-foreground">Workspaces</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">-</p>
                <p className="text-sm text-muted-foreground">Team members</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Join a workspace</p>
                <p className="text-xs text-muted-foreground">Use a team code to join</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Your Workspaces</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Join
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>

          {workspacesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : workspaces.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
            </div>
          ) : (
            <div className="card-elevated p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No workspaces yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create a new workspace or join an existing one using a team code.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join with code
                </Button>
                <Button variant="hero" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createWorkspace}
      />

      <JoinWorkspaceDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onSubmit={joinWorkspace}
      />
    </div>
  );
}
