import { LayoutGrid } from "lucide-react/dist/esm/icons/layout-grid";
import { Users } from "lucide-react/dist/esm/icons/users";
import { Workflow } from "lucide-react/dist/esm/icons/workflow";
import { Bell } from "lucide-react/dist/esm/icons/bell";
import { Zap } from "lucide-react/dist/esm/icons/zap";
import { Shield } from "lucide-react/dist/esm/icons/shield";

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
    <section className="py-24 lg:py-32 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Everything you need to manage projects
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple, powerful tools designed for teams that ship.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-interactive p-6 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
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
