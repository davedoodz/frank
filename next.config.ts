import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // public/prototypes/ est servi en statique : Next ne résout pas index.html
  // pour une URL de dossier. Une redirection garde les chemins relatifs valides
  // (un rewrite laisserait l'URL sur /prototypes, et shared.css partirait à la racine).
  // (the real memory fix is source(none) in app/globals.css)
  async redirects() {
    return [
      { source: "/", destination: "/prototypes/prototype%203.html", permanent: false },
      { source: "/prototypes", destination: "/prototypes/index.html", permanent: false },
    ];
  },
  // Drawings, images, the model and vendored libraries are revalidated on
  // every visit by default. They change rarely, so a returning visitor reads
  // them from cache and the browser refreshes them in the background; page
  // code (HTML and the prototype scripts) keeps the default so edits land.
  async headers() {
    return [
      {
        source: "/prototypes/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=604800" }],
      },
      {
        source: "/prototypes/vendor/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
};

export default nextConfig;
