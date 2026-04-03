import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".tooling/**",
    ".swiftpm-cache/**",
    ".xcode-archives/**",
    ".xcode-derived/**",
    ".xcode-export/**",
    "android/**/build/**",
    "android/app/src/main/assets/public/**",
    "ios/App/App/public/**",
    "ios/App/CapApp-SPM/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
