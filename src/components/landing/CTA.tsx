import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-hero relative overflow-hidden">
      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1"></div>
      <div className="floating-orb floating-orb-2"></div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center animate-slide-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Ready to streamline your workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join teams that use FlowDesk to ship faster and collaborate better.
          </p>
          <Button variant="hero" size="xl" asChild className="hover-lift animate-pulse-glow">
            <Link to="/auth">
              Start for free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
