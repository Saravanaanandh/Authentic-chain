import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Increase server body size limit for image uploads (base64 can be large)
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
