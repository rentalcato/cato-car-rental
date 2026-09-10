/**
 * Vehicle Details page enrichment — everything shown there that the
 * `vehicles` table doesn't actually track yet (weekly/monthly pricing,
 * doors, features/amenities, a written description). None of this is
 * random: every function is a pure, deterministic transform of the
 * vehicle's *real* fields (make/model/year/body_type/fuel_type/
 * transmission/daily_rental_rate), so the same vehicle always renders
 * the same details, on every page load and on both the public and
 * account Vehicle Details pages.
 *
 * This is intentionally isolated from lib/marketing/queries.ts (the real
 * data layer) — swapping any one of these for a real column/table later
 * (e.g. `vehicles.weekly_rate`, a `vehicle_features` table) means
 * replacing one function here, not hunting through page components.
 */

import type { LucideIcon } from "lucide-react";
import {
  AirVent,
  Bluetooth,
  Camera,
  Compass,
  Fan,
  KeyRound,
  Navigation,
  Smartphone,
  SunMedium,
  Timer,
  Usb,
  Wind,
} from "lucide-react";
import type { BodyType, FuelType } from "@/types/database.types";
import type { FleetCard } from "@/lib/marketing/queries";

const LUXURY_MAKES = new Set([
  "mercedes-benz",
  "bmw",
  "audi",
  "lexus",
  "land rover",
  "range rover",
  "porsche",
  "jaguar",
  "volvo",
]);

function isLuxuryVehicle(vehicle: Pick<FleetCard, "make" | "dailyRate">): boolean {
  if (LUXURY_MAKES.has(vehicle.make.trim().toLowerCase())) return true;
  return (vehicle.dailyRate ?? 0) >= 30000;
}

/** Simple deterministic hash on the vehicle id — used only to add small, stable variety between similarly-priced vehicles (never Math.random(), which would differ between server and client renders). */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

/** e.g. "Luxury SUV • Automatic • 5 Seats" */
export function getVehicleTagline(vehicle: Pick<FleetCard, "category" | "transmission" | "seats">): string {
  return `${vehicle.category} • ${vehicle.transmission} • ${vehicle.seats} Seats`;
}

export interface PricingTiers {
  daily: number | null;
  /** ~10% off the straight 7x daily rate — a standard car-rental weekly discount. */
  weekly: number | null;
  /** ~25% off the straight 30x daily rate. */
  monthly: number | null;
  weeklySavingsPct: number;
  monthlySavingsPct: number;
}

/** Pending real `weekly_rate`/`monthly_rate` columns — computed from the one rate the business actually sets today (Vehicles -> Add/Edit -> Daily Rate). */
export function computePricingTiers(dailyRate: number | null): PricingTiers {
  const weeklySavingsPct = 10;
  const monthlySavingsPct = 25;
  if (dailyRate === null) {
    return { daily: null, weekly: null, monthly: null, weeklySavingsPct, monthlySavingsPct };
  }
  return {
    daily: dailyRate,
    weekly: Math.round(dailyRate * 7 * (1 - weeklySavingsPct / 100)),
    monthly: Math.round(dailyRate * 30 * (1 - monthlySavingsPct / 100)),
    weeklySavingsPct,
    monthlySavingsPct,
  };
}

/** Not tracked per-vehicle — a reasonable inference from body type, same as any car-shopping site would estimate before an exact trim is picked. */
export function getEstimatedDoors(bodyType: BodyType | null): number | null {
  switch (bodyType) {
    case "coupe":
    case "convertible":
      return 2;
    case "truck":
      return 4;
    case "van":
      return 4;
    case "sedan":
    case "suv":
    case "hatchback":
      return bodyType === "hatchback" ? 5 : 4;
    default:
      return null;
  }
}

export interface VehicleFeature {
  key: string;
  label: string;
  icon: LucideIcon;
}

const FEATURE_CATALOG: Record<string, VehicleFeature> = {
  air_conditioning: { key: "air_conditioning", label: "Air Conditioning", icon: AirVent },
  bluetooth: { key: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  usb_ports: { key: "usb_ports", label: "USB Ports", icon: Usb },
  backup_camera: { key: "backup_camera", label: "Backup Camera", icon: Camera },
  cruise_control: { key: "cruise_control", label: "Cruise Control", icon: Timer },
  parking_sensors: { key: "parking_sensors", label: "Parking Sensors", icon: Compass },
  navigation: { key: "navigation", label: "Navigation System", icon: Navigation },
  keyless_entry: { key: "keyless_entry", label: "Keyless Entry", icon: KeyRound },
  climate_control: { key: "climate_control", label: "Automatic Climate Control", icon: Wind },
  apple_carplay: { key: "apple_carplay", label: "Apple CarPlay", icon: Smartphone },
  android_auto: { key: "android_auto", label: "Android Auto", icon: Smartphone },
  sunroof: { key: "sunroof", label: "Sunroof", icon: SunMedium },
  heated_seats: { key: "heated_seats", label: "Heated Seats", icon: Fan },
  leather_seats: { key: "leather_seats", label: "Leather Seats", icon: Fan },
  wireless_charging: { key: "wireless_charging", label: "Wireless Charging", icon: Smartphone },
};

/**
 * Pending a real `vehicle_features` table — assembled from price tier
 * (a proxy for trim level) plus the vehicle's real transmission/make, so
 * a luxury SUV and an economy hatchback don't show the same amenity
 * list. Deterministic per vehicle id, not random.
 */
export function getVehicleFeatures(
  vehicle: Pick<FleetCard, "id" | "make" | "dailyRate" | "transmission" | "fuelType">
): VehicleFeature[] {
  const keys = new Set<string>(["air_conditioning", "bluetooth", "usb_ports", "backup_camera"]);
  const rate = vehicle.dailyRate ?? 0;
  const luxury = isLuxuryVehicle(vehicle);

  if (rate >= 18000 || luxury) {
    keys.add("cruise_control");
    keys.add("parking_sensors");
  }
  if (rate >= 25000 || luxury) {
    keys.add("navigation");
    keys.add("keyless_entry");
    keys.add("climate_control");
  }
  if (rate >= 30000 || luxury) {
    keys.add("leather_seats");
    keys.add("sunroof");
    keys.add("heated_seats");
    keys.add("wireless_charging");
    keys.add("apple_carplay");
    keys.add("android_auto");
  }
  if (vehicle.transmission === "Automatic") {
    keys.add("cruise_control");
  }

  // A small, stable variety pass — e.g. two similarly-priced mid-tier
  // sedans don't have to show an identical list.
  const hash = hashId(vehicle.id);
  if (rate >= 18000 && rate < 25000 && hash % 2 === 0) keys.add("navigation");
  if (rate >= 25000 && rate < 30000 && hash % 3 === 0) keys.add("sunroof");

  return Array.from(keys)
    .map((key) => FEATURE_CATALOG[key])
    .filter((f): f is VehicleFeature => Boolean(f));
}

interface DescriptionInput {
  make: string;
  model: string;
  year: number | null;
  category: string;
  seats: number;
  transmission: string;
  dailyRate: number | null;
  bodyType: BodyType | null;
  fuelType: FuelType | null;
}

const FUEL_LABEL: Partial<Record<FuelType, string>> = {
  hybrid: "hybrid",
  electric: "electric",
  diesel: "diesel",
};

/**
 * A real written description per body type/tier, interpolated with the
 * vehicle's actual make/model/seats/transmission — not a single generic
 * paragraph reused everywhere. Pending a real `vehicles.description`
 * column for genuinely per-vehicle copy; until then this is the
 * structured stand-in the spec asks for.
 */
export function getVehicleDescription(vehicle: DescriptionInput): string[] {
  const name = `${vehicle.make} ${vehicle.model}`.trim();
  const luxury = isLuxuryVehicle(vehicle);
  const fuelNote = vehicle.fuelType ? FUEL_LABEL[vehicle.fuelType] : undefined;
  const paragraphs: string[] = [];

  switch (vehicle.bodyType) {
    case "suv":
      paragraphs.push(
        `The ${name} pairs a commanding, confident driving position with genuinely easy handling — light, precise steering in town and a settled, planted feel once you're up to highway speed. ${
          luxury
            ? "The cabin insulates you well from road and wind noise, so long drives stay relaxed rather than tiring."
            : "It's an easy vehicle to get comfortable in quickly, even if this is your first time behind the wheel."
        }`
      );
      paragraphs.push(
        `Inside, there's real room to stretch out across ${vehicle.seats} seats, with a high, elevated view of the road that makes navigating unfamiliar streets noticeably less stressful. Cargo space is generous enough for airport runs with luggage for the whole group, or a proper grocery/hardware-store haul.`
      );
      paragraphs.push(
        `${luxury ? "A refined choice" : "A practical, versatile choice"} for family trips, groups travelling together, or anyone who wants extra ground clearance and cargo room without stepping up to a full-size van.`
      );
      break;

    case "sedan":
      paragraphs.push(
        `The ${name} drives the way a good sedan should — smooth, quiet and composed, with ${vehicle.transmission.toLowerCase()} shifts you barely notice and enough power in reserve for confident overtaking.${
          luxury ? " Cabin refinement is a highlight: soft-touch materials throughout and a noticeably hushed ride at speed." : ""
        }`
      );
      paragraphs.push(
        `${vehicle.seats} seats and a well-shaped trunk make it an easy fit for business trips and airport transfers alike, while the compact footprint means parking and navigating tighter streets stays stress-free.`
      );
      paragraphs.push(
        `Best suited to business travellers, couples, and anyone who wants a comfortable, fuss-free daily driver rather than something bulkier than they need.`
      );
      break;

    case "hatchback":
      paragraphs.push(
        `The ${name} is nimble and easy to place on the road, with light controls that make it genuinely relaxing in city traffic and simple to park in tight spots.`
      );
      paragraphs.push(
        `The cabin is efficiently laid out for ${vehicle.seats}, and the split rear seats/hatch design flex easily between passengers and everyday cargo — grocery runs, small luggage, or a weekend bag or two.`
      );
      paragraphs.push(
        `A smart pick for solo travellers, couples, or anyone prioritising fuel efficiency and easy city driving over outright space.`
      );
      break;

    case "coupe":
      paragraphs.push(
        `The ${name} is the more spirited option in the fleet — a lower, sportier driving position, sharper steering response, and a firmer ride that rewards a more engaged driving style without feeling harsh.`
      );
      paragraphs.push(
        `Inside it's snugger by design, seating ${vehicle.seats} in a driver-focused cabin${
          luxury ? " finished with upscale materials throughout" : ""
        }. This is a car chosen for how it feels to drive, not outright practicality.`
      );
      paragraphs.push(
        `Ideal for a special occasion, a scenic weekend drive, or a customer who simply wants something more exciting than a standard rental.`
      );
      break;

    case "convertible":
      paragraphs.push(
        `The ${name} is built for top-down driving — direct, responsive handling and a genuinely fun character whether you're cruising the coast or just enjoying good weather on an ordinary errand.`
      );
      paragraphs.push(
        `Cabin space is intentionally intimate, seating ${vehicle.seats}, with the roof mechanism folding away cleanly when you want the open-air experience.`
      );
      paragraphs.push(
        `A favourite for special occasions, honeymoons, and visitors who want a memorable driving experience during their trip.`
      );
      break;

    case "van":
      paragraphs.push(
        `The ${name} is built around space and practicality first — a tall, upright driving position with excellent visibility, and a ride that stays composed even loaded up with people or cargo.`
      );
      paragraphs.push(
        `With seating for ${vehicle.seats} and a flexible interior, it's the natural choice when everyone (and everything) needs to travel together in one vehicle rather than splitting into two cars.`
      );
      paragraphs.push(
        `Well suited to group travel, family reunions, airport runs for a full travelling party, or moving significant cargo in one trip.`
      );
      break;

    case "truck":
      paragraphs.push(
        `The ${name} offers a confident, high-set driving position and the kind of low-end pulling power that makes towing and hauling feel unstressed rather than marginal.`
      );
      paragraphs.push(
        `The cabin comfortably seats ${vehicle.seats}, and the open bed adds real-world versatility that a standard passenger vehicle simply can't match.`
      );
      paragraphs.push(
        `A strong fit for job-site work, moving equipment or furniture, or any trip where cargo capacity matters as much as passenger comfort.`
      );
      break;

    default:
      paragraphs.push(
        `The ${name} is a well-rounded, dependable choice — easy to drive, comfortable over longer distances, and equally at home running errands around town.`
      );
      paragraphs.push(
        `It comfortably seats ${vehicle.seats} with a ${vehicle.transmission.toLowerCase()} gearbox that keeps things simple regardless of your experience with the vehicle.`
      );
      paragraphs.push(
        `A dependable all-rounder, suited to almost any trip — business, leisure, or everyday use.`
      );
  }

  if (fuelNote) {
    paragraphs.push(
      `Running on a ${fuelNote} powertrain, it's a lower running-cost option for the length of your rental without asking you to compromise on how it drives.`
    );
  }

  return paragraphs;
}
