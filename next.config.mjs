/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the MAX4 rate-data files are bundled into the serverless function,
  // since the pricing engine reads them from disk at runtime.
  outputFileTracingIncludes: {
    "/": ["./data/2026/**/*"],
  },
  // The pricing engine (lib/pricing) uses explicit ".js" extensions in its TS
  // ESM imports (valid under moduleResolution "Bundler"). webpack doesn't map
  // ".js" -> ".ts" on its own, so teach it to.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
