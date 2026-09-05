export function AboutSection({ businessName }: { businessName: string }) {
  return (
    <section id="about" className="scroll-mt-16 bg-muted/40 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">About {businessName}</h2>
        <p className="mt-5 text-muted-foreground">
          We provide dependable, comfortable rental vehicles designed to make
          every journey simple. Whether you need a vehicle for a day, a
          weekend, business travel or a longer rental, our fleet gives you
          the flexibility to get where you need to go.
        </p>
      </div>
    </section>
  );
}
