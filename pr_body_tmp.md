## Context / Motivation

Adds whitelabel support so a partner org can show their name and logo next to the Tambo brand. Implements TAM-397.

## Changes

- Introduces optional env vars `TAMBO_WHITELABEL_ORG_NAME` and `TAMBO_WHITELABEL_ORG_LOGO` (with `NEXT_PUBLIC_*` fallbacks) and documents them in `docker.env.example`.
- Extends `apps/web/lib/env.ts` types & runtime mapping.
- Updates marketing and dashboard headers to conditionally render the org logo/text alongside the existing Tambo logo.

## Verification

```bash
export TAMBO_WHITELABEL_ORG_NAME="Acme Co"
export TAMBO_WHITELABEL_ORG_LOGO="https://acme.example/logo.svg"
export NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME="$TAMBO_WHITELABEL_ORG_NAME"
export NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO="$TAMBO_WHITELABEL_ORG_LOGO"
```

Run `npm run dev -w apps/web`, visit the site and ensure:

- Both headers show the Tambo logo plus Acme logo/text.
- Omitting either var hides its element; omitting both restores default layout.

Closes TAM-397
