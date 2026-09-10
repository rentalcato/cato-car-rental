const STEPS = [
  { step: "1", title: "Choose Your Vehicle", description: "Browse our fleet and find the right vehicle for your trip." },
  { step: "2", title: "Book Online", description: "Create a free account and request your reservation in minutes." },
  { step: "3", title: "Get Confirmed", description: "We confirm your booking, pricing and any required documents." },
  { step: "4", title: "Pick Up and Drive", description: "Collect your vehicle and get on the road." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How It Works</h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ step, title, description }) => (
          <div key={step} className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {step}
            </div>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
