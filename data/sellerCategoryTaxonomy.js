import { SELLER_MAIN_CATEGORIES } from "./sellerMainCategories.js";

/** Standard label shown in dropdowns for custom entries. */
export const CATEGORY_OTHER_LABEL = "Other (Please mention)";

const OTHER_LABEL_KEYS = new Set([
  "other (please mention)",
  "others (please mention)",
  "others (mention)",
  "other (mention)",
  "other",
]);

export function isOtherCategoryLabel(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  return OTHER_LABEL_KEYS.has(key);
}

export function withOtherOption(list = []) {
  const items = Array.isArray(list) ? [...list] : [];
  if (!items.some((item) => isOtherCategoryLabel(item))) {
    items.push(CATEGORY_OTHER_LABEL);
  }
  return items;
}

const GENERIC_SUBCATEGORIES = ["General"];
const DEFAULT_TYPES = ["General", CATEGORY_OTHER_LABEL];

const SUBCATEGORIES_BY_MAIN = {
  Fashion: [
    "Women’s wear",
    "Men’s wear",
    "Kids’ wear",
    "Ethnic wear",
    "Western wear",
    "Innerwear",
    "Sleepwear",
    "Footwear",
    "Fashion accessories",
    "Jewellery",
  ],
  "Beauty & Personal Care": [
    "Skincare",
    "Haircare",
    "Makeup",
    "Bath & body",
    "Fragrances",
    "Grooming tools",
    "Personal hygiene",
    "Natural beauty",
  ],
  "Health & Wellness": [
    "Fitness accessories",
    "Yoga products",
    "Health devices",
    "Ayurvedic products",
    "Sexual wellness",
    "Immunity support",
  ],
  Electronics: [
    "Mobiles",
    "Mobile accessories",
    "Audio, Wearables",
    "Smart devices",
    "Computer accessories",
    "Cameras",
    "Power banks",
    "Small gadgets",
  ],
  "Home & Kitchen": [
    "Cookware",
    "Serveware",
    "Storage",
    "Home decor",
    "Furnishing",
    "Lighting",
    "Cleaning supplies",
    "Kitchen tools",
    "Utility products",
  ],
  "Home Appliances": [
    "Kitchen appliances",
    "Cleaning appliances",
    "Cooling appliances",
    "Water purifiers",
    "Personal care appliances",
  ],
  "Grocery & Gourmet": [
    "Staples",
    "Snacks",
    "Beverages",
    "Organic food",
    "Dry fruits",
    "Spices",
    "Ready-to-cook",
    "Regional foods",
  ],
  "Books & Stationery": [
    "Academic books",
    "Competitive exam books",
    "Children’s books",
    "Fiction",
    "Non-fiction",
    "Notebooks",
    "Art supplies",
    "Office stationery",
    "School stationary",
  ],
  "Baby & Kids": [
    "Baby care",
    "Feeding",
    "Diapers",
    "Kids fashion",
    "Toys",
    "School essentials",
    "Nursery products",
  ],
  "Toys & Games": [
    "Educational toys",
    "Soft toys",
    "Board games",
    "Activity kits",
    "Outdoor toys",
    "Puzzles",
  ],
  "Pet Supplies": [
    "Pet food",
    "Grooming",
    "Toys",
    "Beds",
    "Bowls",
    "Accessories",
    "Health care",
  ],
  "Sports & Fitness": [
    "Gym equipment",
    "Yoga mats",
    "Sportswear",
    "Outdoor sports gear",
    "Cycling accessories",
    "Recovery tools",
  ],
  "Automotive Accessories": [
    "Bike accessories",
    "Car accessories",
    "Mobile holders",
    "Cleaning kits",
    "Safety products",
  ],
  "Gifts & Occasions": [
    "Birthday gifts",
    "Wedding gifts",
    "Festive gifts",
    "Corporate gifts",
    "Personalized gifts",
    "Return gifts",
  ],
  "Sustainable / Handmade": [
    "Handmade decor",
    "Eco-friendly products",
    "Recycled goods",
    "Artisan products",
    "NGO-made products",
    "Natural fibre products",
  ],
  [CATEGORY_OTHER_LABEL]: GENERIC_SUBCATEGORIES,
};

/** Product types per main + sub-category. */
const TYPES_BY_MAIN_SUB = {
  Fashion: {
    "Women’s wear": [
      "Saree",
      "Kurta",
      "Kurta set",
      "Dupatta",
      "Lehenga",
      "Blouse",
      "Palazzo",
      "Salwar suit",
      "Dress",
      "Top",
      "Skirt",
    ],
    "Men’s wear": [
      "Shirt",
      "T-shirt",
      "Jeans",
      "Trousers",
      "Co-ord set",
      "Jacket",
      "Blazer",
      "Waistcoat",
      "Hoodie",
    ],
    "Kids’ wear": [
      "Frock",
      "Kids kurta set",
      "Romper",
      "T-shirt set",
      "School wear",
      "Night suit",
      "Top",
      "Dress",
    ],
    "Ethnic wear": [
      "Saree",
      "Kurta",
      "Lehenga",
      "Dupatta",
      "Salwar suit",
      "Mojaris",
      "Juttis",
      "Blouse",
    ],
    "Western wear": [
      "Dress",
      "Top",
      "Jeans",
      "Skirt",
      "Jacket",
      "Hoodie",
      "T-shirt",
      "Co-ord set",
    ],
    Innerwear: ["Bra", "Panties", "Vest", "Briefs", "Lingerie set", "Thermals"],
    Sleepwear: ["Night suit", "Pyjama set", "Nightdress", "Robe", "Loungewear set"],
    Footwear: [
      "Sandals",
      "Flats",
      "Heels",
      "Loafers",
      "Sneakers",
      "Slippers",
      "Mojaris",
      "Juttis",
      "Sports shoes",
    ],
    "Fashion accessories": [
      "Handbag",
      "Tote bag",
      "Wallet",
      "Belt",
      "Scarf",
      "Cap",
      "Sunglasses",
      "Hair accessory",
    ],
    Jewellery: [
      "Necklace",
      "Earrings",
      "Bracelet",
      "Ring",
      "Bangles",
      "Anklet",
      "Nose pin",
    ],
  },
  "Beauty & Personal Care": {
    Skincare: ["Face wash", "Moisturizer", "Serum", "Sunscreen", "Toner", "Face mask"],
    Haircare: ["Shampoo", "Conditioner", "Hair oil", "Hair serum", "Hair mask"],
    Makeup: ["Foundation", "Lipstick", "Kajal", "Compact", "Concealer", "Nail polish"],
    "Bath & body": ["Body wash", "Body lotion", "Soap", "Body scrub", "Deodorant"],
    Fragrances: ["Perfume", "Eau de toilette", "Body mist", "Attar"],
    "Grooming tools": ["Trimmer", "Epilator", "Hair dryer", "Straightener"],
    "Personal hygiene": ["Sanitary pads", "Razor", "Cotton pads", "Wet wipes"],
    "Natural beauty": ["Herbal face pack", "Ayurvedic oil", "Ubtan", "Rose water"],
  },
  "Health & Wellness": {
    "Fitness accessories": [
      "Dumbbells",
      "Resistance band",
      "Gym gloves",
      "Skipping rope",
      "Ab roller",
    ],
    "Yoga products": ["Yoga mat", "Yoga block", "Yoga strap", "Yoga wheel", "Meditation cushion"],
    "Health devices": [
      "Thermometer",
      "BP monitor",
      "Glucometer",
      "Pulse oximeter",
      "Weighing scale",
    ],
    "Ayurvedic products": [
      "Ayurvedic supplement",
      "Herbal churna",
      "Ayurvedic oil",
      "Chyawanprash",
      "Kashayam",
    ],
    "Sexual wellness": ["Condoms", "Lubricant", "Intimate wash", "Wellness supplement"],
    "Immunity support": [
      "Vitamin C",
      "Zinc supplement",
      "Herbal immunity booster",
      "Chyawanprash",
      "Honey",
    ],
  },
  Electronics: {
    Mobiles: ["Smartphone", "Feature phone", "Refurbished phone"],
    "Mobile accessories": ["Phone case", "Screen guard", "Charger", "Cable", "Power bank"],
    "Audio, Wearables": ["Earbuds", "Headphones", "Smartwatch", "Speaker"],
    "Smart devices": ["Smart TV stick", "Smart bulb", "Security camera"],
    "Computer accessories": ["Keyboard", "Mouse", "USB hub", "Laptop stand"],
    Cameras: ["DSLR", "Mirrorless", "Action camera", "Webcam"],
    "Power banks": ["10000mAh", "20000mAh", "Fast charge power bank"],
    "Small gadgets": ["Calculator", "Digital clock", "USB fan"],
  },
  "Home & Kitchen": {
    Cookware: ["Pan", "Kadai", "Tawa", "Pressure cooker", "Non-stick set"],
    Serveware: ["Dinner set", "Plates", "Bowls", "Glasses", "Serving tray"],
    Storage: ["Container set", "Jars", "Lunch box", "Racks", "Organizer"],
    "Home decor": ["Wall art", "Vase", "Clock", "Photo frame", "Showpiece"],
    Furnishing: ["Curtains", "Cushion cover", "Bed sheet", "Blanket", "Rug"],
    Lighting: ["LED bulb", "Table lamp", "Ceiling light", "Fairy lights", "Torch"],
    "Cleaning supplies": ["Mop", "Broom", "Cleaning liquid", "Brush", "Duster"],
    "Kitchen tools": ["Knife set", "Peeler", "Grater", "Ladle set", "Chopping board"],
    "Utility products": ["Extension board", "Adapter", "Hooks", "Hangers", "Tool kit"],
  },
  "Home Appliances": {
    "Kitchen appliances": [
      "Mixer grinder",
      "Microwave",
      "OTG",
      "Induction cooktop",
      "Electric kettle",
    ],
    "Cleaning appliances": ["Vacuum cleaner", "Steam mop", "Robot vacuum"],
    "Cooling appliances": ["Air cooler", "Fan", "Air conditioner"],
    "Water purifiers": ["RO purifier", "UV purifier", "Filter cartridge"],
    "Personal care appliances": ["Trimmer", "Hair dryer", "Epilator", "Massager"],
  },
  "Grocery & Gourmet": {
    Staples: ["Rice", "Wheat flour", "Dal", "Pulses", "Cooking oil", "Sugar", "Salt"],
    Snacks: ["Chips", "Namkeen", "Biscuits", "Cookies", "Dry snacks"],
    Beverages: ["Tea", "Coffee", "Juice", "Soft drink", "Health drink"],
    "Organic food": ["Organic rice", "Organic honey", "Organic pulses", "Organic snacks"],
    "Dry fruits": ["Almonds", "Cashews", "Raisins", "Dates", "Mixed dry fruits"],
    Spices: ["Masala powder", "Whole spices", "Blended spices", "Pickle masala"],
    "Ready-to-cook": ["Instant noodles", "Pasta", "Soup mix", "Ready meal"],
    "Regional foods": ["Regional snack", "Regional spice", "Regional sweet", "Regional pickle"],
  },
  "Books & Stationery": {
    "Academic books": ["Textbook", "Reference book", "Guide", "Workbook"],
    "Competitive exam books": ["Exam guide", "Practice set", "Previous papers", "Mock tests"],
    "Children’s books": ["Picture book", "Story book", "Activity book", "Colouring book"],
    Fiction: ["Novel", "Short stories", "Graphic novel"],
    "Non-fiction": ["Biography", "Self-help", "History", "Science"],
    Notebooks: ["Single line", "Double line", "Spiral notebook", "Register"],
    "Art supplies": ["Sketchbook", "Paints", "Brushes", "Craft kit"],
    "Office stationery": ["Pen", "Marker", "Stapler", "File folder"],
    "School stationary": ["Pencil box", "Geometry box", "School bag", "Water bottle"],
  },
  "Baby & Kids": {
    "Baby care": ["Baby lotion", "Baby shampoo", "Baby oil", "Baby powder"],
    Feeding: ["Bottle", "Sipper", "Bowl set", "Spoon set", "Bib"],
    Diapers: ["Newborn diapers", "Tape diapers", "Pants diapers", "Wipes"],
    "Kids fashion": ["Kids t-shirt", "Kids dress", "Kids ethnic wear", "Kids nightwear"],
    Toys: ["Rattle", "Teether", "Soft toy", "Learning toy"],
    "School essentials": ["Lunch box", "Water bottle", "School bag", "Stationery set"],
    "Nursery products": ["Crib sheet", "Baby monitor", "Nursing pillow", "Mosquito net"],
  },
  "Toys & Games": {
    "Educational toys": ["Learning tablet", "STEM kit", "Alphabet toy", "Science kit"],
    "Soft toys": ["Teddy bear", "Plush toy", "Character toy"],
    "Board games": ["Chess", "Ludo", "Monopoly", "Card game"],
    "Activity kits": ["Art kit", "Craft kit", "DIY kit"],
    "Outdoor toys": ["Cycle", "Scooter", "Ball", "Frisbee"],
    Puzzles: ["Jigsaw puzzle", "3D puzzle", "Brain teaser"],
  },
  "Pet Supplies": {
    "Pet food": ["Dog food", "Cat food", "Bird food", "Fish food"],
    Grooming: ["Pet shampoo", "Brush", "Nail clipper", "Grooming glove"],
    Toys: ["Chew toy", "Ball", "Cat teaser", "Rope toy"],
    Beds: ["Pet bed", "Cushion", "Mat"],
    Bowls: ["Food bowl", "Water bowl", "Slow feeder"],
    Accessories: ["Collar", "Leash", "Harness", "ID tag"],
    "Health care": ["Flea treatment", "Vitamins", "Dental chew", "First aid"],
  },
  "Sports & Fitness": {
    "Gym equipment": ["Dumbbell set", "Bench", "Pull-up bar", "Kettlebell"],
    "Yoga mats": ["Yoga mat", "Yoga towel", "Carry bag"],
    Sportswear: ["Sports t-shirt", "Track pants", "Shorts", "Sports bra"],
    "Outdoor sports gear": ["Cricket bat", "Football", "Badminton racket", "Tennis ball"],
    "Cycling accessories": ["Helmet", "Cycling gloves", "Lights", "Pump"],
    "Recovery tools": ["Foam roller", "Massage gun", "Ice pack", "Compression sleeve"],
  },
  "Automotive Accessories": {
    "Bike accessories": ["Helmet", "Bike cover", "Phone mount", "Riding gloves"],
    "Car accessories": ["Seat cover", "Floor mat", "Steering cover", "Sun shade"],
    "Mobile holders": ["Dashboard mount", "Vent mount", "Bike mount"],
    "Cleaning kits": ["Car wash kit", "Microfiber cloth", "Polish", "Vacuum"],
    "Safety products": ["Fire extinguisher", "Emergency kit", "Tyre inflator", "Jump cables"],
  },
  "Gifts & Occasions": {
    "Birthday gifts": ["Gift hamper", "Personalized mug", "Toy gift set", "Chocolate box"],
    "Wedding gifts": ["Gift set", "Home decor gift", "Jewellery gift box"],
    "Festive gifts": ["Diya set", "Sweet box", "Festive hamper"],
    "Corporate gifts": ["Pen set", "Diary", "Gift card", "Desk organizer"],
    "Personalized gifts": ["Custom photo frame", "Engraved item", "Custom print"],
    "Return gifts": ["Small toy pack", "Snack pack", "Stationery pack"],
  },
  "Sustainable / Handmade": {
    "Handmade decor": ["Hand-painted decor", "Macrame", "Pottery", "Wall hanging"],
    "Eco-friendly products": ["Bamboo product", "Reusable bag", "Eco bottle", "Compostable item"],
    "Recycled goods": ["Recycled notebook", "Upcycled decor", "Recycled bag"],
    "Artisan products": ["Handloom product", "Handcrafted jewellery", "Artisan craft"],
    "NGO-made products": ["NGO craft", "NGO food product", "NGO textile"],
    "Natural fibre products": ["Jute product", "Cotton handmade", "Coir product"],
  },
};

function normalizeTaxonomyText(value) {
  return String(value || "")
    .trim()
    .replace(/[\u2018\u2019\u201B]/g, "'");
}

/** Match user input to canonical main category name (handles typos / casing). */
export function resolveTaxonomyMainKey(main) {
  const raw = normalizeTaxonomyText(main);
  if (!raw) return "";
  if (SUBCATEGORIES_BY_MAIN[raw]) return raw;
  const lower = raw.toLowerCase();
  const hit = SELLER_MAIN_CATEGORIES.find((c) => c.toLowerCase() === lower);
  return hit || raw;
}

export function resolveTaxonomySubKey(mainKey, sub) {
  const raw = normalizeTaxonomyText(sub);
  if (!raw) return "";
  const subs = SUBCATEGORIES_BY_MAIN[mainKey] || [];
  if (subs.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  const hit = subs.find((s) => normalizeTaxonomyText(s).toLowerCase() === lower);
  return hit || raw;
}

function buildDefaultTypesForSub(mainKey, subKey) {
  const curated = TYPES_BY_MAIN_SUB[mainKey]?.[subKey];
  if (curated?.length) return curated;
  return [subKey, "Standard", "Premium"].filter(Boolean);
}

export function getMainCategoryOptions() {
  return withOtherOption(SELLER_MAIN_CATEGORIES);
}

export function getSubcategoriesForMain(main) {
  const key = resolveTaxonomyMainKey(main);
  if (!key) return [];
  if (isOtherCategoryLabel(key)) {
    return withOtherOption(GENERIC_SUBCATEGORIES);
  }
  const list = SUBCATEGORIES_BY_MAIN[key];
  if (list) return withOtherOption(list);
  return withOtherOption(GENERIC_SUBCATEGORIES);
}

export function getTypesForMainSub(main, sub) {
  const mainKey = resolveTaxonomyMainKey(main);
  const subKey = resolveTaxonomySubKey(mainKey, sub);
  if (!mainKey || !subKey) return [];
  if (isOtherCategoryLabel(mainKey) || isOtherCategoryLabel(subKey)) {
    return withOtherOption(DEFAULT_TYPES);
  }
  return withOtherOption(buildDefaultTypesForSub(mainKey, subKey));
}

/** @deprecated use getTypesForMainSub */
export function getTypesForMain(main) {
  return getTypesForMainSub(main, "");
}

export function getCategoryTaxonomyForApi() {
  const mains = getMainCategoryOptions();
  const subcategoriesByMain = {};
  const typesByMainSub = {};

  for (const main of SELLER_MAIN_CATEGORIES) {
    subcategoriesByMain[main] = getSubcategoriesForMain(main);
    typesByMainSub[main] = {};
    for (const sub of SUBCATEGORIES_BY_MAIN[main] || []) {
      typesByMainSub[main][sub] = getTypesForMainSub(main, sub);
    }
  }

  return {
    otherLabel: CATEGORY_OTHER_LABEL,
    mains,
    subcategoriesByMain,
    typesByMainSub,
    defaultTypes: withOtherOption(DEFAULT_TYPES),
  };
}

export function assertCategoryPathResolved(category, premiumType) {
  const path = normalizePathFromFields(category, premiumType);
  if (!path.main || !path.sub || !path.type) {
    const err = new Error(
      "Main Category, Sub-Category, and Type are required."
    );
    err.statusCode = 400;
    throw err;
  }
  if (
    isOtherCategoryLabel(path.main) ||
    isOtherCategoryLabel(path.sub) ||
    isOtherCategoryLabel(path.type)
  ) {
    const err = new Error(
      'When you select "Other (Please mention)", enter your custom category in the field below.'
    );
    err.statusCode = 400;
    throw err;
  }
  return path;
}

function normalizePathFromFields(category, premiumType) {
  const raw = String(category || "").trim();
  const parts = raw ? raw.split("/").map((p) => p.trim()).filter(Boolean) : [];
  return {
    main: parts[0] || "",
    sub: parts[1] || "",
    type: String(premiumType || "").trim(),
  };
}
