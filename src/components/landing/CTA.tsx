import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="border-y border-sidebar-border bg-sidebar py-20 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase text-sidebar-primary">Move work forward</p>
          <h2 className="mb-5 font-display text-3xl font-semibold text-sidebar-foreground sm:text-5xl">
            Your team’s clearest path from plan to done.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-sidebar-foreground/70">
            Start with a focused workspace today. Add your team when you are ready.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/auth">
              Start using FlowDesk
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
