import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  outDir: "dist",
  clean: true,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  external: ["@repo/db"],
  noExternal: ["@repo/kafka", "@repo/auth-middleware", "@repo/types"],
});
