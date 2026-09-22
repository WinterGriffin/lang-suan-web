# Lang Suan — project instructions

Before implementing or changing the app, read docs/START-HERE.md and the relevant source-of-truth documents it lists. Use docs/SPECIFICATION.md for business rules and docs/DATABASE.md with docs/schema.sql for database contracts. Read docs/CHANGELOG.md for accepted changes.

The canonical design documents are under docs/. Any older design copies at the repository root are reference copies, not a second source of truth. Keep changes to requirements explicit and update the related documents together.

The prototype contains mock data. Database migrations and RLS/JWT integration tests still require verification in a disposable Supabase project before production use.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
