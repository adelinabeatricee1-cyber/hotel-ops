import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for photos uploaded straight from a phone
      // camera (housekeeping proof photos, hotel cover image).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
