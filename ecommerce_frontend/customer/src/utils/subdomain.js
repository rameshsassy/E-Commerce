export function getSubdomain(hostname) {
  if (!hostname) return null;
  const domain = hostname.toLowerCase();

  // Handle production domain
  if (domain.endsWith(".aashansh.org")) {
    const sub = domain.replace(".aashansh.org", "");
    if (sub && sub !== "www" && sub !== "api" && sub !== "admin" && sub !== "seller") {
      return sub;
    }
  }

  // Handle local development domain
  if (domain.endsWith(".localhost")) {
    const sub = domain.replace(".localhost", "");
    if (sub && sub !== "www" && sub !== "api" && sub !== "admin" && sub !== "seller") {
      return sub;
    }
  }

  // Fallback for general domains with subdomains (e.g. raymond-fashion-store.somehost.com)
  const parts = domain.split(".");
  if (parts.length > 2) {
    const sub = parts[0];
    if (
      sub &&
      sub !== "www" &&
      sub !== "api" &&
      sub !== "admin" &&
      sub !== "seller" &&
      !sub.includes("localhost") &&
      !sub.includes("127.0.0.1")
    ) {
      return sub;
    }
  }

  return null;
}
