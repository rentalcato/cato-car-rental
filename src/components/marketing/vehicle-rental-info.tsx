import { CalendarClock, Fuel, Gauge, Shield, Undo2, UserCheck, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PublicBusinessInfo, PublicRentalPolicy } from "@/types/database.types";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

/**
 * Real, staff-set policy (app_settings, via public_rental_policy — 0023)
 * everywhere it exists; standard industry-practice copy only for the
 * handful of things this system doesn't track yet (age requirement,
 * exact document list, cancellation window).
 */
export function VehicleRentalInfo({
  policy,
  business,
}: {
  policy: PublicRentalPolicy | null;
  business: PublicBusinessInfo | null;
}) {
  // Unit-agnostic on purpose, matching Settings -> Rental Policy's own
  // "per mile/km" wording — this system doesn't commit to one unit.
  const mileageAllowance = policy?.mileage_limit_per_day
    ? `${policy.mileage_limit_per_day} per day included${
        policy.mileage_overage_fee ? ` — ${formatCurrency(policy.mileage_overage_fee)}/mi or km after that` : ""
      }`
    : "Unlimited mileage";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <InfoRow icon={CalendarClock} label="Minimum Rental Period" value="1 day" />
      <InfoRow icon={Gauge} label="Mileage Allowance" value={mileageAllowance} />
      <InfoRow icon={Fuel} label="Fuel Policy" value={policy?.fuel_policy || "Return with the same fuel level as at pickup"} />
      <InfoRow
        icon={Undo2}
        label="Late Return"
        value={
          policy
            ? `${policy.grace_period_hours}-hour grace period, then ${formatCurrency(policy.late_fee_per_day)}/day`
            : "A grace period applies before late fees"
        }
      />
      <InfoRow icon={UserCheck} label="Documents Required" value="Valid driver's license and a government-issued photo ID or passport" />
      <InfoRow icon={Shield} label="Age Requirement" value="Minimum 21 years old with a valid license held for at least 1 year" />
      <InfoRow
        icon={Shield}
        label="Security Deposit"
        value={policy?.default_security_deposit ? `${formatCurrency(policy.default_security_deposit)}, refunded after return inspection` : "Collected at pickup"}
      />
      <InfoRow
        icon={CalendarClock}
        label="Cancellation Policy"
        value="Free cancellation any time before your reservation is confirmed for pickup"
      />
      {business?.address ? (
        <InfoRow icon={Undo2} label="Pickup & Return Location" value={business.address} />
      ) : null}
      {business?.business_hours ? <InfoRow icon={CalendarClock} label="Opening Hours" value={business.business_hours} /> : null}
    </div>
  );
}
