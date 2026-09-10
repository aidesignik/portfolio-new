export interface PricingConfig {
  ratePerKm: number;
  fixedFee: number;
  currency: string;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  ratePerKm: Number(process.env.DEFAULT_RATE_PER_KM ?? 120),
  fixedFee: Number(process.env.DEFAULT_FIXED_FEE ?? 1500),
  currency: process.env.DEFAULT_CURRENCY ?? "RSD",
};

export function suggestPrice(
  distanceKm: number,
  carrierOverride?: {
    ratePerKm?: number | null;
    fixedFee?: number | null;
  },
): number {
  const ratePerKm = carrierOverride?.ratePerKm ?? DEFAULT_PRICING_CONFIG.ratePerKm;
  const fixedFee = carrierOverride?.fixedFee ?? DEFAULT_PRICING_CONFIG.fixedFee;
  const price = distanceKm * ratePerKm + fixedFee;
  return Math.round(price);
}
