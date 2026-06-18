import { Link } from "@tanstack/react-router";
import { getImageUrl } from "@/lib/utils";

export function HeaderLogo({ logo }) {

  const showLogoImage = logo?.enabled && logo?.url;

  return (
    <Link to="/" className="shrink-0 flex items-center min-w-0 transition-opacity hover:opacity-90">
      {showLogoImage ? (
        <img
          src={getImageUrl(logo.url)}
          alt="Aashansh Logo"
          className="h-8 sm:h-10 w-auto object-contain max-w-[180px]"
        />
      ) : (
        <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-primary uppercase select-none">
          Aashansh
        </span>
      )}
    </Link>
  );
}
