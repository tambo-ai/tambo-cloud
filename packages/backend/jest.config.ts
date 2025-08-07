import { createRequire } from "module";
import type { JestConfigWithTsJest } from "ts-jest";

// Polyfill require for ESM Jest config (Node 20+).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _require: any =
  typeof require !== "undefined" ? require : createRequire(import.meta.url);

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  prettierPath: _require.resolve("prettier-2"),
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
