import { Workspace } from "@/types/database";
import { Folder, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [copied, setCopied] = useState(false);

  const copyTeamCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(workspace.team_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link to={`/workspace/${workspace.id}`} className="block">
      <div className="card-interactive p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
            <Folder className="h-6 w-6 text-accent-foreground" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
          {workspace.name}
        </h3>

        {workspace.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {workspace.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Team Code:</span>{" "}
            <span className="font-mono">{workspace.team_code}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyTeamCode}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
}
