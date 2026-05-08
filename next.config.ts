import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't auto-detect the empty
  // package-lock.json one directory up (which lives at
  // C:\Users\karst\Documents\Cortyze\) and emit a "multiple lockfiles"
  // warning on every build. Turbopack honors this for FS scope.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
