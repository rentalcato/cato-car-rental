import { ShieldCheck, CalendarClock, SlidersHorizontal, Headset, Wrench, Key } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheck, title: "Reliable Vehicles", description: "A dependable fleet, inspected and ready for every journey." },
  { icon: CalendarClock, title: "Easy Reservations", description: "A straightforward process from booking to pickup." },
  { icon: SlidersHorizontal, title: "Flexible Rental Options", description: "Daily, weekend or extended rentals to fit your plans." },
  { icon: Headset, title: "Excellent Customer Service", description: "A team that's easy to reach and quick to help." },
  { icon: Wrench, title: "Well-Maintained Fleet", description: "Regular service and inspection on every vehicle we rent." },
  { icon: Key, title: "Simple Pickup & Return", description: "Clear, hassle-free handover at the start and end of your rental." },
];

export function WhyChooseUs() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Why Choose Us</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
