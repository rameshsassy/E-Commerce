import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/services";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderCategories } from "./HeaderCategories";
import { BulkPurchaseButton } from "./BulkPurchaseButton";
import { SearchBar } from "./SearchBar";
import { CartIcon } from "./CartIcon";
import { AccountMenu } from "./AccountMenu";
import { MobileMenu } from "./MobileMenu";

const defaultCategories = [
  { _id: "1", name: "Books & Stationery", slug: "books-stationery", isActive: true },
  { _id: "2", name: "Grocery & Gourmet", slug: "grocery-gourmet", isActive: true },
  { _id: "3", name: "Fashion", slug: "fashion", isActive: true },
];

const defaultSettings = {
  logo: { url: "/brand/aashansh-logo.png", enabled: true },
  searchBar: { enabled: true, placeholder: "Search products, brands, categories..." },
  bulkPurchase: { enabled: true, text: "Bulk Purchase", link: "/bulk-purchase" },
  cartIcon: { enabled: true },
  accountMenu: { enabled: true },
};

export function Header() {
  // 1. Fetch homepage settings
  const { data: settings } = useQuery({
    queryKey: ["homepageSettings"],
    queryFn: () => publicApi.getHomepageSettings(),
  });

  // 2. Fetch active header navigation categories
  const { data: categories } = useQuery({
    queryKey: ["headerCategories"],
    queryFn: () => publicApi.getHeaderCategories(),
  });

  const displaySettings = settings || defaultSettings;
  const displayCategories = (categories && categories.length > 0) ? categories : defaultCategories;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Mobile Hamburger Drawer (left) */}
        <MobileMenu config={displaySettings} categories={displayCategories} />

        {/* Left Side: Brand Logo / Stylized text fallback */}
        <HeaderLogo logo={displaySettings.logo} />

        {/* Middle Left: Category lists & more dropdown */}
        <HeaderCategories categories={displayCategories} />

        {/* Middle Right: Search input field */}
        <SearchBar config={displaySettings.searchBar} />

        {/* Right Side Icons / User menu actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
          {/* B2B Bulk Purchase Link */}
          <BulkPurchaseButton config={displaySettings.bulkPurchase} />

          {/* Cart counter */}
          <CartIcon config={displaySettings.cartIcon} />

          {/* Account/profile link */}
          <AccountMenu config={displaySettings.accountMenu} />
        </div>
      </div>
    </header>
  );
}
export default Header;
