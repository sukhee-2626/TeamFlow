const stats = [
  { value: "12,000+", label: "Teams onboarded" },
  { value: "4.9/5", label: "Customer rating" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "2.3x", label: "Faster delivery" },
];

export function Stats() {
  return (
    <section className="py-16 bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"></div>
      <div className="container relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center stagger-children">
          {stats.map((s) => (
            <div key={s.label} className="text-primary-foreground">
              <div className="text-4xl md:text-5xl font-bold mb-2">{s.value}</div>
              <div className="text-sm md:text-base opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}