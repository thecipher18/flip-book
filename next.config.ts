import type { NextConfig } from "next";

// No `images` config: Drive photos are private, so they're fetched with an
// access token and rendered from object URLs rather than through next/image.
const nextConfig: NextConfig = {};

export default nextConfig;
