# Cloudflare deployment

Use the committed parameter files as the only source of non-secret environment
configuration. `NEXT_PUBLIC_*` values are embedded in client bundles at build
time, so staging and production are always built separately.

## Environments

| Environment | Worker | Supabase |
|---|---|---|
| local | local dev server | Docker local |
| staging | `lang-suan-staging` | `orhdmqeojhesaldsuild` |
| production | `lang-suan` | `carrbgyuqqnofczoavyg` |

Set the production domain in `config/production-parameter.conf` before any
production build. The placeholder is deliberately rejected by validation.

## Secrets

Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only in ignored local env files or
GitHub/Cloudflare secrets. Keep LINE Channel Secret, service-role keys, database
passwords and Cloudflare tokens out of Git. Set `APP_URL` as a Cloudflare Worker
secret matching each deployed origin.

## Commands

`npm run validate:staging`, `npm run build:staging`, and `npm run deploy:staging`
load staging parameters. Production equivalents perform stricter validation and
require `CLOUDFLARE_API_TOKEN`. Roll back with Cloudflare Workers Versions by
redeploying the last known-good Git tag after rebuilding for that environment.
