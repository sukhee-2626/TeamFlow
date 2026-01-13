import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Plus, 
  LogOut, 
  Folder,
  Users,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <span className="text-sm text-muted-foreground">
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
            Here's an overview of your workspaces and tasks.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                <Folder className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
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
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-sm text-muted-foreground">Team members</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">In progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Your Workspaces</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>

          {/* Empty state */}
          <div className="card-elevated p-12 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No workspaces yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first workspace to start organizing your projects and collaborating with your team.
            </p>
            <Button variant="hero">
              <Plus className="h-4 w-4 mr-2" />
              Create your first workspace
            </Button>
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="card-elevated p-8 text-center">
            <p className="text-muted-foreground">
              Your recent activity will appear here once you start working on tasks.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
