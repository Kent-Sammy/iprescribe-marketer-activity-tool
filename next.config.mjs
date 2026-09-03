/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run explicitly via `npm run lint` (and in CI). We don't want a
    // stray lint warning to block `next build`. Revisit once CI enforces lint
    // on PRs.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
