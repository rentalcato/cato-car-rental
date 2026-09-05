import { BODY_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from "@/lib/constants";

/**
 * Display labels for vehicle spec enums — shared between the vehicle
 * form (staff-facing) and the public/customer fleet pages, so both sides
 * show the same wording. Plain data, no "use client"/"use server" — safe
 * to import from either.
 */
export const FUEL_TYPE_LABELS: Record<(typeof FUEL_TYPES)[number], string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
  other: "Other",
};

export const TRANSMISSION_LABELS: Record<(typeof TRANSMISSION_TYPES)[number], string> = {
  automatic: "Automatic",
  manual: "Manual",
  other: "Other",
};

export const BODY_TYPE_LABELS: Record<(typeof BODY_TYPES)[number], string> = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupe",
  convertible: "Convertible",
  van: "Van",
  truck: "Truck",
  other: "Other",
};
