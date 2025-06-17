import "@testing-library/jest-dom";

// -----------------------------------------------------------------------------
// Mock the env module that is consumed across the web app during tests.
//
// • The real implementation reads from `process.env` at build time via
//   `@/env` (or `@/env.mjs`). In the Jest runtime these variables are not
//   guaranteed to exist, so any import of the module would throw.
// • Providing a stub keeps the typings intact while ensuring the tests run
//   in a deterministic environment.
// • Extend / adjust the keys below whenever new env-vars are introduced.
// -----------------------------------------------------------------------------
jest.mock("@/lib/env", () => ({
  env: {
    // Browser-exposed variables
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.com",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",

    // Server-only variables
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));
