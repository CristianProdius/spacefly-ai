import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const productServiceUrl =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

const getProductServiceUploadPattern = () => {
  try {
    const url = new URL(productServiceUrl);
    const basePath = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");

    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: `${basePath}/uploads/**`,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
};

const productServiceUploadPattern = getProductServiceUploadPattern();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(productServiceUploadPattern ? [productServiceUploadPattern] : []),
    ],
  },
};

export default withNextIntl(nextConfig);
