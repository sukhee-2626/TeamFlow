export function TrustedBy() {
  const companies = ["ACME CORP", "NORTHWIND", "GLOBEX", "INITECH", "UMBRELLA", "STARK IND", "WAYNE CO", "HOOLI"];
  return (
    <section className="border-y border-border/50 bg-background/60 backdrop-blur-sm py-10">
      <div className="container">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Trusted by 12,000+ teams worldwide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6 items-center justify-items-center opacity-70">
          {companies.map((c) => (
            <span key={c} className="text-sm md:text-base font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}