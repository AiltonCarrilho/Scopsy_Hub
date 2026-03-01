import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Subpath /lab — todas as rotas ficam sob /lab/*
  basePath: '/lab',

  // Variaveis de ambiente publicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },

  // Otimizacoes
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
