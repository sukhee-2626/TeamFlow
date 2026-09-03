import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/forever",
    description: "For individuals getting started.",
    features: ["Up to 3 workspaces", "10 team members", "Real-time chat", "Basic kanban boards"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Business",
    price: "$12",
    period: "/user/month",
    description: "For teams that ship.",
    features: ["Unlimited workspaces", "Unlimited members", "Custom workflows", "Advanced permissions", "Priority support", "99.99% uptime SLA"],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations at scale.",
    features: ["Everything in Business", "SSO & SAML", "Dedicated CSM", "Custom contracts", "On-prem deployment", "24/7 phone support"],
    cta: "Talk to sales",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-wallpaper relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-slide-up">
          <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-4">
            PRICING
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Simple pricing. Serious value.
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when your team grows. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto stagger-children">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative card-glass p-8 hover-lift flex flex-col ${
                tier.highlight ? "ring-2 ring-primary shadow-glow scale-105" : ""
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gradient-primary">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.highlight ? "hero" : "outline"}
                size="lg"
                className="w-full"
              >
                <Link to="/auth">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          🔒 SOC 2 Type II · GDPR · HIPAA-ready · 30-day money-back guarantee
        </p>
      </div>
    </section>
  );
}