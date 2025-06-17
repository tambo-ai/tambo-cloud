import type { JestConfigWithTsJest } from "ts-jest";

/**
 * This configuration makes Jest + ts-jest work seamlessly with:
 *  – ES modules (`useESM: true`)
 *  – TypeScript **and** TSX files
 *  – the path aliases defined for `@/*` and all internal packages
 *
 * The preset `ts-jest/presets/js-with-ts-esm` already wires the correct
 * transformer for `.ts` and `.tsx` sources, so we no longer need to
 * provide a custom `transform` rule.
 */
const config: JestConfigWithTsJest = {
  /** Use the ESM-ready preset that handles both JS/TS and TSX code. */
  preset: "ts-jest/presets/js-with-ts-esm",

  testEnvironment: "jsdom",

  extensionsToTreatAsEsm: [".ts", ".tsx"],

  /** 👇 NEW: ensure ts-jest always transforms .ts/.tsx sources */
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },

  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        jsx: "react-jsx",
      },
    },
  },

  prettierPath: require.resolve("prettier"),
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
};

export default config;
