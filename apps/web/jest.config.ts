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

  /**
   * Tell Jest those extensions must be treated as ESM so that imports using
   * the native `import` syntax keep working in tests.
   */
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  /** Module-alias mapping that mirrors the aliases from tsconfig. */
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },

  /**
   * Global ts-jest options.
   * `useESM: true` enables ESM output; the project tsconfig is reused.
   */
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: "<rootDir>/tsconfig.json",
    },
  },

  /** Prettier is used for snapshot formatting. */
  prettierPath: require.resolve("prettier"),

  /** Per-test setup (RTL, jest-dom, etc.). */
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  /** Ignore build artefacts & Next.js output when looking for tests. */
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
};

export default config;
