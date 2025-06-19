import type { JestConfigWithTsJest } from "ts-jest";

/**
 * Jest configuration for the Next.js web app.
 *
 * • Uses the `default-esm` preset from ts-jest so TypeScript/TSX files are
 *   transformed correctly in an ESM-aware way.
 * • jsdom provides a browser-like environment for React component tests.
 * • Path aliases (`@/…` and the monorepo packages) are mapped so that source
 *   files can be loaded without compiling the whole workspace.
 */
const config: JestConfigWithTsJest = {
  // ESM-aware preset with TSX support
  preset: "ts-jest/presets/default-esm",

  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  moduleNameMapper: {
    // Mock static asset imports (images, icons, etc.) so they resolve during tests
    "\\.(svg|png|jpe?g|gif|webp|avif|ico)$": "<rootDir>/__mocks__/fileMock.js",

    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../../packages/$1/src",
  },

  // Ensure ts-jest transpiles JSX to JavaScript instead of leaving it intact.
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx",
      },
    },
  },

  // Provided by the preset – no manual transform necessary
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],
};

export default config;
