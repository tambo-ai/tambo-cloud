// Jest mock for `@t3-oss/env-nextjs` (and any sub-paths).
// Provides minimal stubs so that `{ createEnv, vercel, env }` can be imported
// in unit tests without the real library (which relies on the Next.js runtime).

/**
 * Mimics the createEnv helper from @t3-oss/env-nextjs.
 * For tests we can safely return an object whose `client` prop is empty.
 */
const createEnv = () =>
  // The real createEnv returns an object whose `client` property contains
  // the resolved environment variables.  Tests do not need them.
  ({ client: {} });

/**
 * In the real library `vercel()` is a helper function that inspects Vercel
 *-specific env vars and returns an object.  The implementation details are
 * irrelevant for unit tests so we stub it with a function that always returns
 * an empty object.
 */
function vercel() {
  return {};
}

module.exports = {
  __esModule: true,
  // Stubbed helper to mirror the library’s signature.
  createEnv,
  // Vercel-specific helper.
  vercel,
  // Generic env export used throughout the web app.
  env: {},
};
