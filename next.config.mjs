/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run explicitly via `pnpm lint` (and in CI). We don't want a stray
    // lint warning to block `next build` during the frontend/mock phase.
    // Revisit once the backend lands and CI enforces lint on PRs.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
