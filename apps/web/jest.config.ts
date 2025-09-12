import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "app/**/*.ts",
    "app/**/*.tsx",
    "components/**/*.ts",
    "components/**/*.tsx",
    "lib/**/*.ts",
    "lib/**/*.tsx",
    "providers/**/*.ts",
    "providers/**/*.tsx",
    "trpc/**/*.ts",
    "trpc/**/*.tsx",
    "hooks/**/*.ts",
    "hooks/**/*.tsx",
  ],
  rootDir: ".",
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$":
      "<rootDir>/test/__mocks__/fileMock.cjs",
    "^@/lib/env$": "<rootDir>/test/__mocks__/envMock.ts",
    "^@modelcontextprotocol/sdk/client/streamableHttp\\.js$":
      "<rootDir>/test/__mocks__/mcpStreamableHttpMock.ts",
    "^@modelcontextprotocol/sdk/client/sse\\.js$":
      "<rootDir>/test/__mocks__/mcpSseMock.ts",
    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          allowJs: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: [
    "/node_modules/(?!@modelcontextprotocol/sdk|pkce-challenge)/",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
};

export default config;
