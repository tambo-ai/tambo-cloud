import { createRequire } from "module";
import type { JestConfigWithTsJest } from "ts-jest";

// Workaround for ESM Jest config: emulate `require` for prettierPath resolution
// so we don't break on newer Node versions where `require` is undefined.
// Using `createRequire()` allows us to keep existing behaviour without
// converting the file to CommonJS.
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
