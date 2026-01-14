import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Plus, 
  LogOut, 
  Folder,
  Loader2,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { JoinWorkspaceDialog } from "@/components/workspace/JoinWorkspaceDialog";
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

  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-wallpaper relative overflow-hidden page-transition">
      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1"></div>
      <div className="floating-orb floating-orb-2"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary animate-pulse-glow">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FlowDesk</span>
          </div>

          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-sm text-muted-foreground">{userEmail}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover-lift">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 relative z-10">
        {/* Welcome section */}
        <div className="flex items-start justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              Welcome back! <span className="text-2xl animate-bounce-in" style={{ animationDelay: "0.3s" }}>👋</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your workspaces and collaborate with your team
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowJoinDialog(true)} className="hover-lift">
              <UserPlus className="h-4 w-4 mr-2" />
              Join with Code
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="hover-lift">
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
