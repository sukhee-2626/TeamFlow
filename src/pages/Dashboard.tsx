import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  LogOut, 
  Folder,
  Loader2,
  UserPlus,
  CalendarDays
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { JoinWorkspaceDialog } from "@/components/workspace/JoinWorkspaceDialog";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { workspaces, isLoading: workspacesLoading, createWorkspace, joinWorkspace } = useWorkspaces();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);


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

  const userEmail = user?.email || "";

  return (
    <div className="flex min-h-screen flex-col bg-wallpaper page-transition">
      <AppHeader
        subtitle="Workspace command center"
        actions={
          <>
            <div className="hidden text-right leading-tight lg:block">
              <p className="text-sm font-semibold text-foreground">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
              <p className="text-xs text-muted-foreground">{now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="max-w-56 truncate text-sm text-muted-foreground">{userEmail}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <main className="container py-8 relative z-10">
        {/* Welcome section */}
        <div className="mb-8 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-accent-foreground">Your workspaces</p>
            <h1 className="mb-2 font-display text-3xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">
              Manage your workspaces and collaborate with your team
            </p>
          </div>
          
          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <Button variant="outline" onClick={() => navigate("/schedule")}>
              <CalendarDays className="h-4 w-4 mr-2" />
              My Schedule
            </Button>
            <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Join with Code
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>
        </div>

        {/* Workspaces grid */}
        {workspacesLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : workspaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        ) : (
          <div className="card-glass p-12 text-center animate-scale-in">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center animate-bounce-in">
              <Folder className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No workspaces yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create a new workspace or join an existing one using a team code.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowJoinDialog(true)} className="hover-lift">
                <UserPlus className="h-4 w-4 mr-2" />
                Join with code
              </Button>
              <Button variant="hero" onClick={() => setShowCreateDialog(true)} className="hover-lift">
                <Plus className="h-4 w-4 mr-2" />
                Create workspace
              </Button>
            </div>
          </div>
        )}
      </main>

      <AppFooter />

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
