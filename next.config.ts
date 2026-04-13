import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly off: React Compiler + async server actions + local pending state
  // can trigger endless Fast Refresh / recompilation in dev (see create-account flow).
  reactCompiler: false,
};

export default nextConfig;