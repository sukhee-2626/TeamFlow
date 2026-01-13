import { LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <LayoutGrid className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">FlowDesk</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FlowDesk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
