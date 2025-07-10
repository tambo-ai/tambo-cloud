# Documentation Writing Guidelines

These guidelines apply to all pages in the `apps/web/content/docs` section of the
repository. Follow them whenever you add or update documentation.

## Bite-Sized Pages (🚨 **New Requirement**)

- **One topic per page** – every stand-alone page must cover a _single_ concept,
  task, or API. Avoid multi-topic “kitchen-sink” overviews.
- **Keep it short** – as a rule of thumb aim for **≤ 150 lines** of Markdown/
  MDX content. If a page grows beyond this, split it into logical follow-up
  pages and add “Related” links.
- **F-pattern structure** – start with a two-sentence summary, followed by a
  code block or diagram, then supporting details.
- **Cross-link** – always end with a “Related” section so readers can navigate
  to peer topics.

## Structure

- Front-matter must include `title` and `description`.
- Use `##` for main sections – never nest deeper than `####`.
- Prefer the `Callout` component (info/warning) instead of blockquotes.

## Writing Style

- Active voice, present tense.
- Use American English spelling (organize, color, center).
- Code snippets should be copy-paste-able and include filenames with
  ` ```tsx title="file.tsx" ` fences.

## Conventions

- Component names: `PascalCase`.
- CLI commands: `$` prefix for the prompt.
- Environment variables: `UPPER_SNAKE_CASE`.

---

_When in doubt, create a draft PR and request feedback before investing large
amounts of time._
