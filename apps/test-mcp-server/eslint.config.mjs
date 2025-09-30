import baseConfig from "@tambo-ai-cloud/eslint-config/base.mjs";

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];
