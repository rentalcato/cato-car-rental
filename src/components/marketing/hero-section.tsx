import Image from "next/image";
import { HERO_IMAGE_URL } from "@/lib/marketing/queries";

export function HeroSection() {
  return (
    <section id="top" className="relative flex min-h-[85vh] scroll-mt-16 items-center overflow-hidden">
      <Image
        src={HERO_IMAGE_URL}
        alt="A premium Mercedes-Benz AMG, available in our rental fleet"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Standard photo-darkening overlay for text legibility — not a glow/gradient effect. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-semibold tracking-wide text-white/70 uppercase">
            Premium Vehicle Rentals
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Drive Your Way
          </h1>
          <p className="mt-5 text-lg text-white/85">
            Reliable, comfortable and premium vehicles for every journey.
          </p>
          <p className="mt-3 text-sm text-white/70">
            Choose from a range of dependable vehicles for business, travel,
            events or everyday transportation — built for teams and
            travelers who expect more.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#fleet"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Browse Vehicles
            </a>
            <a
              href="#fleet"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Reserve a Vehicle
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
