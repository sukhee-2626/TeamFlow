import { Workspace } from "@/types/database";
import { Folder, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { prefetchWorkspacePage } from "@/lib/prefetch";

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link to={`/workspace/${workspace.id}`} onMouseEnter={prefetchWorkspacePage} className="block group">
      <div className="card-glass p-6 h-full hover-lift transition-all duration-300 group-hover:border-primary/30">
        <div className="mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {workspace.name}
          </h3>

          {workspace.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {workspace.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{workspace.member_count || 0} members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(workspace.created_at), 'M/d/yyyy')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
