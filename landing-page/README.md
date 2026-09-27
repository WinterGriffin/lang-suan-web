# LangSuan landing site

This is the public, dependency-free static site for
`https://www.langsuanapp.com`. It is intentionally isolated from the Next.js /
Vinext application, which is deployed separately at
`https://app.langsuanapp.com`.

The publishable site root is `public/`. It contains no application code,
authentication, API calls, or production data.

## Commands

- `npm run landing:validate` checks required files, paths, canonical URL,
  CTA targets, sitemap/robots values, and responsive CSS breakpoints.
- `npm run landing:preview` validates then deploys the separate preview Worker
  `langsuan-landing-preview`.
- `npm run landing:deploy` validates then deploys the static-only production
  Worker `langsuan-landing`.

The commands explicitly use this directory's Wrangler config. Never deploy
the landing page through the repository-root Worker config or the application
deployment commands. Custom-domain changes remain separate: `www` is the only
landing hostname; do not modify `langsuanapp.com` or `app.langsuanapp.com`.
