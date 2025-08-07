import { createRequire } from "node:module";
import type { JestConfigWithTsJest } from "ts-jest";

// `require` isn't available in ESM scope, but Jest still expects a path string
// for `prettierPath`. Create a scoped `require` using Node's `createRequire`.
// This avoids the ReferenceError that bubbles up when the config is parsed.
const require = createRequire(import.meta.url);

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  prettierPath: require.resolve("prettier-2"),
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

export default config;
