import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/services";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderCategories } from "./HeaderCategories";
import { BulkPurchaseButton } from "./BulkPurchaseButton";
import { SearchBar } from "./SearchBar";
import { CartIcon } from "./CartIcon";
import { AccountMenu } from "./AccountMenu";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  // 1. Fetch homepage settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["homepageSettings"],
    queryFn: () => publicApi.getHomepageSettings(),
  });

  // 2. Fetch active header navigation categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["headerCategories"],
    queryFn: () => publicApi.getHeaderCategories(),
  });

  const isLoading = settingsLoading || categoriesLoading;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Mobile Hamburger Drawer (left) */}
        <MobileMenu config={settings} categories={categories || []} />

        {/* Left Side: Brand Logo / Stylized text fallback */}
        <HeaderLogo logo={settings?.logo} />

        {/* Middle Left: Category lists & more dropdown */}
        <HeaderCategories categories={categories || []} />

        {/* Middle Right: Search input field */}
        <SearchBar config={settings?.searchBar} />

        {/* Right Side Icons / User menu actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
          {/* B2B Bulk Purchase Link */}
          <BulkPurchaseButton config={settings?.bulkPurchase} />

          {/* Cart counter */}
          <CartIcon config={settings?.cartIcon} />

          {/* Account/profile link */}
          <AccountMenu config={settings?.accountMenu} />
        </div>
      </div>
    </header>
  );
}
export default Header;
