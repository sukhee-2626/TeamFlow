import { Link } from "react-router-dom";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} FlowDesk. Work with clarity.</p>
        <nav className="flex items-center gap-5" aria-label="Product navigation">
          <Link to="/dashboard" className="transition-colors hover:text-foreground">Workspaces</Link>
          <Link to="/schedule" className="transition-colors hover:text-foreground">My schedule</Link>
        </nav>
      </div>
    </footer>
  );
}