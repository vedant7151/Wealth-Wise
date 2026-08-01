const DEFAULT_SITE_URL = "https://wealth-wise-tawny.vercel.app";

export function getAbsoluteSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || DEFAULT_SITE_URL;

  if (siteUrl.startsWith("http")) {
    return siteUrl;
  }

  return `https://${siteUrl}`;
}