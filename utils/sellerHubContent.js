/** Static copy for seller hub — Refer & Earn and About Us pages */

export const SELLER_REFER_PROGRAM = {
  title: "Refer and Earn",
  subtitle: "Invite fellow sellers to Aashansh and earn rewards when they join and get approved.",
  steps: [
    {
      title: "Share your link",
      description: "Send your unique referral link to business owners who want to sell on Aashansh.",
    },
    {
      title: "They register as sellers",
      description: "Your contact signs up using your link or enters your referral code during registration.",
    },
    {
      title: "Earn when they go live",
      description:
        "Once their seller account is approved and they start listing products, you earn referral credits (program terms apply).",
    },
  ],
  rewards: [
    "₹500 platform credit per approved seller referral",
    "Bonus credits when your referral upgrades to Premium",
    "No limit on how many sellers you can refer",
  ],
  termsNote:
    "Rewards are credited after the referred seller completes KYC approval. Aashansh may update reward amounts with notice on this page.",
};

export const SELLER_ABOUT_US = {
  title: "About Us",
  tagline: "Aashansh — empowering Indian sellers to reach buyers nationwide.",
  sections: [
    {
      heading: "Our mission",
      body: "We help small and growing businesses list products, manage orders, and scale through a trusted B2B and retail marketplace built for India.",
    },
    {
      heading: "For sellers",
      body: "Use Seller Hub to manage catalog, KYC, shipments, bulk inquiries, analytics, and premium tools — all in one place.",
    },
    {
      heading: "Support",
      body: "Questions about payouts, KYC, or orders? Reach us via Support on the main site or email seller care at the address shown in your welcome email.",
    },
  ],
  links: [
    { label: "Customer support", path: "/support" },
    { label: "FAQ", path: "/faq" },
  ],
};
