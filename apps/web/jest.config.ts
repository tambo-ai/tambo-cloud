import type { JestConfigWithTsJest } from "ts-jest";

/**
 * Jest configuration for the Next.js web app.
 *
 * • Uses ts-jest with ESM so imports stay modern.
 * • jsdom provides a browser-like environment for React component tests.
 * • Path aliases (`@/…` and the monorepo packages) are mapped so that source
 *   files can be loaded without compiling the whole workspace.
 */
const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../../packages/$1/src",
  },
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: true }],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],
};

export default config;
