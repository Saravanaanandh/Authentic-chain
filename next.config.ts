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
  async rewrites() {
    return [
      {
        source: "/auth/instagram/callback",
        destination: "/api/auth/callback/instagram",
      },
    ];
  },
};

export default nextConfig;
