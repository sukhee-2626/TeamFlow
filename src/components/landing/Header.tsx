import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { prefetchAuth } from "@/lib/prefetch";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 animate-fade-in">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary animate-pulse-glow">
            <LayoutGrid className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">FlowDesk</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform"
          >
            Features
          </Link>
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform"
          >
            Pricing
          </Link>
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform"
          >
            About
          </Link>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button variant="ghost" size="sm" asChild className="hover-lift">
            <Link to="/auth" onMouseEnter={prefetchAuth}>Sign in</Link>
          </Button>
          <Button size="sm" asChild className="hover-lift">
            <Link to="/auth" onMouseEnter={prefetchAuth}>Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
