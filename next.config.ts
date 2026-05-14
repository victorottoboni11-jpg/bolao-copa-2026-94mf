import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração de imagens para remotePatterns
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  // Turbopack configurado (vazio = default)
  turbopack: {},
};

export default nextConfig;
