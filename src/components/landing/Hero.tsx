import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { prefetchAuth } from "@/lib/prefetch";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24 lg:py-32">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-orb floating-orb-1"></div>
        <div className="floating-orb floating-orb-2"></div>
        <div className="floating-orb floating-orb-3"></div>
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/80 backdrop-blur-sm px-4 py-1.5 text-sm text-accent-foreground animate-bounce-in">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Simple project management for modern teams</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-slide-up">
            Manage projects with{" "}
            <span className="text-gradient-primary">clarity and focus</span>
          </h1>

          {/* Subheading */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            FlowDesk brings your team together with intuitive workflows, 
            real-time collaboration, and a clean interface that gets out of your way.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild className="hover-lift">
              <Link to="/auth" onMouseEnter={prefetchAuth}>
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="hover-lift">
              <Link to="/auth" onMouseEnter={prefetchAuth}>
                Sign in
              </Link>
            </Button>
          </div>

          {/* Features list */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground stagger-children">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Real-time sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Team collaboration</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
