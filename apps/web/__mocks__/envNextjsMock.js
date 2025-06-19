// Jest mock for `@t3-oss/env-nextjs` (and any sub-paths).
// Provides minimal stubs so that `{ createEnv, vercel, env }` can be imported
// in unit tests without the real library (which relies on Next.js runtime).
const createEnv = () =>
  // The real createEnv returns an object whose `client` prop contains the
  // environment variables.  For tests we can safely return an empty object.
  ({ client: {} });

const vercel = {
  // Popular Vercel provided vars that libraries occasionally read.
  NODE_ENV: process.env.NODE_ENV ?? "test",
  VERCEL_ENV: process.env.VERCEL_ENV ?? "development",
};

module.exports = {
  __esModule: true,
  // Stubbed helper to mirror the library’s signature.
  createEnv,
  // Vercel-specific env helpers/constants.
  vercel,
  // Generic env export used throughout the web app.
  env: {},
};
