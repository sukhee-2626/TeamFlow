import { LayoutGrid, Users, Workflow, Bell, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Kanban Boards",
    description: "Visualize your workflow with drag-and-drop task boards. Move tasks through stages effortlessly.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, assign roles, and work together in real-time across workspaces.",
  },
  {
    icon: Workflow,
    title: "Custom Workflows",
    description: "Create workflows that match your process. Add, rename, and reorder stages as needed.",
  },
  {
    icon: Bell,
    title: "Real-time Updates",
    description: "See changes instantly. When teammates update tasks, you see it immediately.",
  },
  {
    icon: Zap,
    title: "Fast & Minimal",
    description: "A clean interface that loads fast and stays out of your way. Focus on what matters.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Your data is protected with enterprise-grade security and role-based access controls.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border bg-background py-20 lg:py-28">
      <div className="container">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase text-accent-foreground">Built for execution</p>
          <h2 className="mb-4 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            One system for the work that matters
          </h2>
          <p className="text-lg text-muted-foreground">
            Bring planning, communication, and delivery into a calm, accountable workflow.
          </p>
        </div>

        <div className="grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group border-b border-r border-border bg-card p-7 transition-colors hover:bg-secondary/60"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="font-display text-sm text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
