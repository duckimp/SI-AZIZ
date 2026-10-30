/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: true, // Disabled until app is stable
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
});

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Cache statis 1 tahun untuk aset media/gambar di public
        source: "/:all*(svg|jpg|png|webp|ico|mp3)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
