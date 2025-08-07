import type { JestConfigWithTsJest } from "ts-jest";
import { createRequire } from "module";

// Jest config executes in an ESM context where `require` is not defined. We
// create a scoped CommonJS `require` implementation so we can continue to use
// `require.resolve()` without converting the entire file to dynamic `import()`
// calls.
// See: https://nodejs.org/api/modules.html#create-a-require-function-for-use-with-es-modules
 
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
