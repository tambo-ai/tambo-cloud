/* Ambient module declarations for highlight.js sub-path imports
   so TypeScript can resolve them without “Cannot find module …” errors. */

declare module "highlight.js/lib/core" {
  const hljs: any; // Using any – highlight.js does not ship its own types for the modular build.
  export default hljs;
}

declare module "highlight.js/lib/languages/*" {
  const language: any;
  export default language;
}
