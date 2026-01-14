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
    <section className="py-24 lg:py-32 bg-wallpaper relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>

      <div className="container relative z-10">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16 animate-slide-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Everything you need to manage projects
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple, powerful tools designed for teams that ship.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-glass p-6 hover-lift group"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
