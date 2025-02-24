This document describes the process for releasing a new version of the various Hydra repos and packages.

All of the Hydra repos are managed using [release-please](https://github.com/googleapis/release-please).

In general, the process is as follows for any repo:

1. When new PRs are merged, release-please will automatically create or update a
   new release candidate on the `main` branch. New PRs _must_ be named using
   [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   Generally this means prefixing the PR title with either `fix` if it's a bug
   fix, `feat` if it's a new feature, or `chore` if it's a refactor or other
   change that doesn't add or remove any functionality.
2. A PR will be automatically created or updated that updates the version of the
   Hydra packages in the `package.json` files.
3. When the release PR is merged, release-please will create a new release on
   GitHub and either:
   - If it is a library, it will create a new release and push it to NPM.
   - If it is an app, it will create a new release and push it to Vercel/Railway

It is also important to understand the flow for updating the Hydra API. Key points:

- The Hydra API is built in the `apps/api` directory. When a new version of the monorepo is released, the Hydra API is built and deployed to Railway.
- The Hydra API is exposed with OpenAPI, with the spec exposed at `/api-json` (e.g. https://api.hydra.sh/api-json).
- We use [Stainless](https://stainlessapi.com/) to generate the the Hydra client SDKs from the OpenAPI spec.
- Stainless polls our API for the spec, so when we push a new version of the Hydra API to Railway, the Hydra client SDKs will be updated in https://github.com/use-hydra-ai/hydra-ai-node
  - A developer can also force an immediate request of the OpenAPI spec in [Stainless Studio](https://app.stainlessapi.com/hydra-ai/hydra-ai/studio?language=node) by clicking the "Release Flow" button.
- When a new version of the Hydra client SDKs is released, a release PR will be automatically created in https://github.com/use-hydra-ai/hydra-ai-node/pulls. A developer must approve the release PR for it to be released to NPM as `@hydra-ai/client`.
- Once the new Hydra client SDK is released, a developer must update the react-hydra package by either running dependabot at https://github.com/use-hydra-ai/hydra-ai-react/network/updates or by manually updating the `@hydra-ai/react` package version in the `package.json` file by running:
  ```
  npx ncu -u @hydra-ai/client
  ```
-
