/**
 * Referral code — the only piece of the loyalty program that's still
 * purely derived rather than DB-backed (there's no real referral-
 * tracking mechanism yet — see 0024's comment on the referral_completed
 * earning rule). Points, rules and rewards themselves are all real,
 * admin-configurable data now — see lib/loyalty/queries.ts and
 * lib/loyalty/actions.ts.
 */
export function getReferralCode(customerNumber: string): string {
  return `REF-${customerNumber}`;
}
