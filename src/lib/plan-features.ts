// Plan features for SellerCFO

export const PLAN_FEATURES = {
  basic: {
    name: "Essential",
    price: 199,
    features: [
      "Core KPI Dashboard",
      "Shopify + Amazon Integration",
      "QuickBooks Sync",
      "Unit Economics Tracking",
      "30-day Data History",
      "Email Support"
    ],
  },
  pro: {
    name: "Professional",
    price: 399,
    features: [
      "Essential +",
      "Etsy, WooCommerce & TikTok Shop",
      "Inventory Forecasting",
      "Custom Reports",
      "API Access",
      "Unlimited History",
      "Priority Support"
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 799,
    features: [
      "Professional +",
      "Walmart + All Sales Channels",
      "Multi-store Support",
      "Custom Integrations",
      "Dedicated Account Manager",
      "Advanced AI Insights"
    ],
  },
} as const;

export type PlanTier = keyof typeof PLAN_FEATURES;

export function getPlanName(plan: PlanTier): string {
  return PLAN_FEATURES[plan]?.name ?? 'Essential';
}

export function getPlanPrice(plan: PlanTier): number {
  return PLAN_FEATURES[plan]?.price ?? 199;
}
