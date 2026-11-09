import { createRequire } from "node:module";

// Compatibility bridge: typescript-eslint requires the TypeScript 6 programmatic API
// when TypeScript 7 is installed (see https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
const require = createRequire(import.meta.url);
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "typescript") {
    try {
      return originalLoad("@typescript/typescript6", parent, isMain);
    } catch {}
  }
  return originalLoad(request, parent, isMain);
};

const { defineConfig, globalIgnores } = await import("eslint/config");
const nextVitals = (await import("eslint-config-next/core-web-vitals")).default;
const nextTs = (await import("eslint-config-next/typescript")).default;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "ecosystem.config.cjs",
    "public/vendor/**",
  ]),
  {
    rules: {
      "prefer-const": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
