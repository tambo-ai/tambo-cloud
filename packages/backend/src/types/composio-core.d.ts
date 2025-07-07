// Temporary stub for the missing "composio-core" types.
// Once composio-core publishes proper type definitions we can remove this file.

declare module "composio-core" {
  /**
   * The shape of the OpenAIToolSet is not needed for compile-time checks in the
   * backend package right now. We only require the symbol to exist so that the
   * TypeScript compiler does not error.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type OpenAIToolSet = any;
}
