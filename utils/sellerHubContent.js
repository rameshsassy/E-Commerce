/** Static copy for seller hub — Refer & Earn and About Us pages */

export const SELLER_REFER_PROGRAM = {
  title: "Refer and Earn",
  subtitle: "Invite fellow sellers to Aashansh and earn rewards when they join and get approved.",
  shareTemplate: "Hey! Join me on Aashansh - sell your products to bulk buyers, individual customers, earn rewards, and more. Click to join: {{Link}} Use my code {{CODE}} and get 25% discount on premium plans. Let’s grow together!",
  steps: [
    {
      title: "Share your link or send an invite",
      description:
        "Copy your referral link or send a branded invitation email from this page to business owners who want to sell on Aashansh.",
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
  rewardsTitle: "Existing Rewards",
  rewardsSubtitle: "Terms of use",
  rewards: [
    "Referrals are valid only when the invited seller successfully completes KYC verification, creates a store, and lists at least 3 products.",
    "Referrals that are fraudulent, self-referrals, or created using duplicate accounts will not qualify for rewards.",
    "Aashansh reserves the right to deny rewards, suspend accounts, or take legal action for suspicious activities including fake referrals, bot-generated sign-ups, spamming, or violating platform policies. Multiple accounts by the same user will be disqualified",
    "This Refer and Earn program is valid until the last date of your subscription or until Aashansh terminates it. Aashansh may modify reward amounts, eligibility criteria, or terminate the program at any time without prior notice. Existing earned rewards will remain valid.",
  ],
  termsNote: "",
};

export const SELLER_REFER_PLAN_ROWS = [
  {
    label: "Estimated Referral Earning",
    basic: "Upto ₹ 300000/- annually*",
    pro: "Upto ₹ 600000/- annually*",
    premium: "Upto ₹ 2400000/- annually*",
  },
  {
    label: "Seller invitations",
    basic: "Unlimited",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    label: "Seller Subscription Commission",
    basic: "5%",
    pro: "10%",
    premium: "25%",
  },
  {
    label: "Product sale",
    basic: "5%",
    pro: "10%",
    premium: "25%",
  },
  {
    label: "Digital ads",
    basic: "Payable on actuals",
    pro: "Payable on actuals",
    premium: "Payable on actuals",
  },
  {
    label: "Training & Tools",
    basic: "NA",
    pro: "Yes",
    premium: "Yes",
  },
  {
    label: "Inbound seller leads",
    basic: "NA",
    pro: "NA",
    premium: "Upto 5000 leads annually",
  },
  {
    label: "Outbound seller leads",
    basic: "NA",
    pro: "Up to 15000 leads annually",
    premium: "Upto 15000 leads annually",
  },
];

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
