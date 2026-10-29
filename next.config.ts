import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // public/prototypes/ est servi en statique : Next ne résout pas index.html
  // pour une URL de dossier. Une redirection garde les chemins relatifs valides
  // (un rewrite laisserait l'URL sur /prototypes, et shared.css partirait à la racine).
  // The Vercel builder has 2 cores and 8 GB. Next forks a webpack worker and a
  // pool of minifier workers; together they run the container out of memory and
  // the build dies with SIGKILL. One core, no separate build worker: slower,
  // but it finishes.
  experimental: { cpus: 1, webpackBuildWorker: false },
  async redirects() {
    return [{ source: "/prototypes", destination: "/prototypes/index.html", permanent: false }];
  },
};

export default nextConfig;
