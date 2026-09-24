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

## Auth email delivery with Resend

Supabase Auth continues to own signup, email confirmation, and sessions. Configure
Resend as **custom SMTP in each hosted Supabase project**, not in the Worker or
`NEXT_PUBLIC_*` environment. Use the verified Resend sender address and an API
key scoped for sending email. In the Supabase Auth SMTP settings, use host
`smtp.resend.com`, port `465`, username `resend`, and the Resend API key as the
password. Keep the sender address and key out of committed parameter files.

Configure staging first, then send a new-user confirmation email and verify the
link returns to the staging origin. Production SMTP is a separate change after
the sender domain and production callback have been verified. Local Docker Auth
continues to deliver into its local email testing inbox; it must not consume
the hosted Resend key.

## Commands

`npm run dev:local` starts the local Vinext server with Docker Supabase at
`http://localhost:3000`. `npm run validate:staging`, `npm run build:staging`,
and `npm run deploy:staging`
load staging parameters. Production equivalents perform stricter validation and
require `CLOUDFLARE_API_TOKEN`. Roll back with Cloudflare Workers Versions by
redeploying the last known-good Git tag after rebuilding for that environment.
