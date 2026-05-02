export const PLAN_OPTIONS = [
  {
    id: "bomegrow-unlimited",
    label: "BOMEGROW Unlimited",
    basePrice: 2499,
    gstPercent: 18,
    price: "Rs 2499 / month + 18% GST",
    subtitle: "Unlimited users",
    months: 1,
    provider: "razorpay",
    features: [
      "Unlimited users",
      "All BOMEGROW modules included",
      "Admin Panel access reserved for platform owner only",
    ],
  },
];

export const findPlanById = (planId) =>
  PLAN_OPTIONS.find((plan) => plan.id === planId) || PLAN_OPTIONS[0];

export const getPlanPricing = (plan) => {
  const base = Number(plan?.basePrice || 0);
  const gstPercent = Number(plan?.gstPercent || 0);
  const gstAmount = (base * gstPercent) / 100;
  const total = base + gstAmount;

  return {
    base,
    gstPercent,
    gstAmount,
    total,
  };
};
