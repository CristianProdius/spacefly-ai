export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

// Public origin used for canonical URLs / metadataBase. Without it Next falls
// back to http://localhost:<port>, so relative canonicals would point there.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://spacefly.ai";

export const ORDER_SERVICE_URL =
  process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:8001";
