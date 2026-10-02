import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pins the Turbopack workspace root to this project — without it, a
  // stray lockfile in a parent directory (e.g. a developer's home folder)
  // makes Next.js guess the wrong root and ignore this project's own
  // package-lock.json.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withNextIntl(nextConfig);
