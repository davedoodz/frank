import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // public/prototypes/ est servi en statique : Next ne résout pas index.html
  // pour une URL de dossier. Une redirection garde les chemins relatifs valides
  // (un rewrite laisserait l'URL sur /prototypes, et shared.css partirait à la racine).
  // (the real memory fix is source(none) in app/globals.css)
  async redirects() {
    return [{ source: "/prototypes", destination: "/prototypes/index.html", permanent: false }];
  },
};

export default nextConfig;
