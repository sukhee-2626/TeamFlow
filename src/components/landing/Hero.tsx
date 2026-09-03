import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, KanbanSquare, MessageSquareText, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-hero py-20 lg:py-28">
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-accent px-4 py-1.5 text-xs font-semibold uppercase text-accent-foreground">
            The operating system for focused teams
          </div>

          <h1 className="mb-6 font-display text-4xl font-semibold text-foreground sm:text-6xl lg:text-7xl">
            FlowDesk
            <span className="mt-2 block text-gradient-primary">Run every project with clarity.</span>
          </h1>

          <p className="mx-auto mb-9 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Plan work, coordinate your team, and keep delivery moving in one composed workspace built for accountability.
          </p>

          <div className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth">
                Start building free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/auth">
                Sign in to FlowDesk
              </Link>
            </Button>
          </div>

          <div className="grid overflow-hidden rounded-lg border border-border bg-card text-left shadow-card sm:grid-cols-3">
            {[
              [KanbanSquare, "Custom workflows", "Shape every process"],
              [MessageSquareText, "Team conversations", "Keep context close"],
              [CalendarDays, "Personal planning", "Own every deadline"],
            ].map(([Icon, title, copy], index) => (
              <div key={String(title)} className={`flex items-center gap-3 p-4 ${index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{String(title)}</span>
                  <span className="block text-xs text-muted-foreground">{String(copy)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> No credit card required
          </div>
        </div>
      </div>
    </section>
  );
}
