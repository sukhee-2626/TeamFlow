import type { ReactNode } from "react";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function AppHeader({
  title = "FlowDesk",
  subtitle,
  backTo,
  backLabel = "Back",
  badge,
  actions,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-soft supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          {backTo && (
            <Button variant="ghost" size="icon" asChild aria-label={backLabel}>
              <Link to={backTo}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-soft">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate font-display text-lg font-semibold text-foreground">{title}</span>
                {badge}
              </span>
              {subtitle && (
                <span className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</span>
              )}
            </span>
          </Link>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 sm:gap-3">{actions}</div>}
      </div>
    </header>
  );
}