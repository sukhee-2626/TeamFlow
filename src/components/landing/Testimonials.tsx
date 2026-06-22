import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "FlowDesk cut our project delivery time in half. The ROI was obvious in the first month.",
    name: "Sarah Chen",
    role: "VP Engineering, Northwind",
  },
  {
    quote: "We replaced three tools with FlowDesk and saved over $40k a year. Best decision of the quarter.",
    name: "Marcus Reed",
    role: "COO, Globex",
  },
  {
    quote: "Onboarding was instant. Our 80-person team was fully productive on day one.",
    name: "Priya Natarajan",
    role: "Head of Operations, Initech",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-warning text-warning" />
            ))}
            <span className="ml-2 text-sm font-semibold text-foreground">4.9 from 2,400+ reviews</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Loved by teams that mean business
          </h2>
          <p className="text-lg text-muted-foreground">
            From scrappy startups to Fortune 500 — FlowDesk powers their best work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {testimonials.map((t) => (
            <div key={t.name} className="card-glass p-8 hover-lift">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}