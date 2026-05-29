/** Indian states & union territories */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

/** Major cities for autocomplete */
export const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Allahabad",
  "Prayagraj",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Guwahati",
  "Chandigarh",
  "Solapur",
  "Hubli",
  "Mysore",
  "Tiruchirappalli",
  "Bareilly",
  "Aligarh",
  "Moradabad",
  "Jalandhar",
  "Bhubaneswar",
  "Salem",
  "Warangal",
  "Guntur",
  "Bhiwandi",
  "Saharanpur",
  "Gorakhpur",
  "Bikaner",
  "Amravati",
  "Noida",
  "Jamshedpur",
  "Bhilai",
  "Cuttack",
  "Firozabad",
  "Kochi",
  "Bhavnagar",
  "Dehradun",
  "Durgapur",
  "Asansol",
  "Nellore",
  "Udaipur",
  "Mangalore",
  "Belagavi",
  "Thiruvananthapuram",
  "Tiruppur",
  "Kozhikode",
  "Akola",
  "Bokaro",
  "Bellary",
  "Patiala",
  "Agartala",
  "Bhagalpur",
  "Muzaffarpur",
  "Panaji",
  "Shimla",
  "Gangtok",
  "Imphal",
  "Shillong",
  "Aizawl",
  "Kohima",
  "Itanagar",
];

let _cachedIndianCities = null;
let _cachedIndianStates = null;

async function tryLoadCountryStateCity() {
  try {
    const mod = await import("country-state-city");
    return mod;
  } catch {
    return null;
  }
}

export async function getIndianCities() {
  if (Array.isArray(_cachedIndianCities)) return _cachedIndianCities;
  const lib = await tryLoadCountryStateCity();
  if (!lib?.City) {
    _cachedIndianCities = INDIAN_CITIES;
    return _cachedIndianCities;
  }
  const cities = lib.City.getCitiesOfCountry("IN") || [];
  const names = [...new Set(cities.map((c) => c?.name).filter(Boolean))].sort();
  _cachedIndianCities = names.length > 0 ? names : INDIAN_CITIES;
  return _cachedIndianCities;
}

export async function getIndianStates() {
  if (Array.isArray(_cachedIndianStates)) return _cachedIndianStates;
  const lib = await tryLoadCountryStateCity();
  if (!lib?.State) {
    _cachedIndianStates = INDIAN_STATES;
    return _cachedIndianStates;
  }
  const states = lib.State.getStatesOfCountry("IN") || [];
  const names = [...new Set(states.map((s) => s?.name).filter(Boolean))].sort();
  _cachedIndianStates = names.length > 0 ? names : INDIAN_STATES;
  return _cachedIndianStates;
}

/** Delivery regions for "All over India" */
export const ALL_INDIA_REGIONS = [
  "All India",
  "Pan India",
  "North India",
  "South India",
  "East India",
  "West India",
  "Central India",
  "Northeast India",
  "Metro cities",
  "Tier 1 cities",
  "Tier 2 cities",
  "Rural India",
  "Urban India",
  "Jammu & Kashmir region",
  "Himalayan region",
  "Coastal India",
  "Desert region (Rajasthan)",
  "Island territories",
];

export const DELIVERY_BY_OPTIONS = [
  { value: "pincode", label: "Pin-codes" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "all_india", label: "All over India" },
];

/** @deprecated prefer filterSuggestionsStartsWith for delivery autocomplete */
export function filterSuggestions(list, query, limit = 15) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return list.slice(0, limit);
  return list
    .filter((item) => item.toLowerCase().includes(q))
    .slice(0, limit);
}

/**
 * Names that start with the typed query (e.g. "m" → Mumbai, Mysuru, not "Chemmumiahpet").
 */
export function filterSuggestionsStartsWith(list, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return list.filter((item) => item.toLowerCase().startsWith(q));
}

export function filterSuggestionsStartsWithLimited(list, query, limit = 80) {
  return filterSuggestionsStartsWith(list, query).slice(0, limit);
}
