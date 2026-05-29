/** Default KYC entity types — seeded when collection is empty */
export const DEFAULT_KYC_ENTITY_TYPES = [
  { code: "private_limited", label: "Private Limited", sortOrder: 1 },
  { code: "public_limited", label: "Public Limited", sortOrder: 2 },
  { code: "sole_proprietor", label: "Sole Proprietor", sortOrder: 3 },
  { code: "partnership_firm", label: "Partnership Firm", sortOrder: 4 },
  { code: "llp", label: "LLP (Limited Liability Partnership)", sortOrder: 5 },
  { code: "opc", label: "OPC (One Person Company)", sortOrder: 6 },
  { code: "self_help_group", label: "Self Help Group", sortOrder: 7 },
  { code: "section_8", label: "Section 8", sortOrder: 8 },
  { code: "society", label: "Society", sortOrder: 9 },
  { code: "trust", label: "Trust", sortOrder: 10 },
  { code: "individual", label: "Individual", sortOrder: 11 },
  {
    code: "others",
    label: "Others (Please mention)",
    sortOrder: 12,
    requiresOtherText: true,
  },
];

export const OTHERS_ENTITY_CODE = "others";
