# LangSuan HTTPS/TLS rollout

## Architecture and current gate

Local: browser → `https://localhost` → Caddy in Docker → Next.js web or local
Supabase API. Caddy binds only `127.0.0.1:443` and `127.0.0.1:80`; the web
container has no host-published port. Local Supabase still listens on the host
at port 54321 over HTTP, but the browser must use the same-origin HTTPS proxy.
The web container reaches Supabase internally via
`http://host.docker.internal:54321`. Do not expose that internal port publicly.
Local Supabase Auth's external callback is configured through the same HTTPS
proxy at `https://localhost/auth/v1/callback`.

Staging: Cloudflare Worker custom domain `staging.langsuanapp.com`; Cloudflare
terminates browser TLS and manages its certificate. No origin certificate or
separate public reverse proxy is needed. **Observed 2026-09-25:** the complete
Cloudflare DNS inventory contained five records: only Staging's AAAA was
proxied; four Resend email records were DNS-only. No HTTP-only dependency was
found. Cloudflare zone-wide **Always Use HTTPS** was then enabled and the
minimum TLS version raised from 1.0 to 1.2. TLS 1.3 remains enabled; HSTS
remains disabled. Staging HTTP now redirects to HTTPS. The deployed Worker
still lacks the new security headers until a reviewed Staging deployment.
Cloudflare SSL mode reads `Full`, not `Full (strict)`; confirm the absence of
any independent HTTPS origin before changing this zone-wide setting. Do not
enable Flexible SSL. For a Worker custom domain, the
Worker itself is the origin; Full (strict) applies only if an independent origin
server exists. [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[Cloudflare HTTPS enforcement](https://developers.cloudflare.com/ssl/edge-certificates/encrypt-visitor-traffic/).

The canonical Production application origin is `app.langsuanapp.com`.
`langsuanapp.com` is reserved for a separate Marketing/Landing deployment;
`www.langsuanapp.com` should redirect permanently to the marketing root.
Legacy root-to-app redirect Worker files remain in the repository but are no
longer deployed by the Production workflow. The public root, www, and app
hostnames did not resolve from this environment on 2026-09-25. Production
Supabase Auth still uses a localhost Site URL and must be corrected before
Production deployment. No Production Worker, Auth, or DNS change was made.

## Local setup on Windows

1. Install `mkcert` on the developer machine. Run
   `powershell -ExecutionPolicy Bypass -File scripts/setup-local-https.ps1`.
   This installs its local CA into the local trust store and creates a
   certificate for `localhost`, `127.0.0.1`, and `::1` in ignored
   `.local-certs/`. Running it again leaves an existing pair unchanged.
2. Start Docker Desktop and local Supabase (`npx.cmd supabase start`). Use a
   local-only `.env.local` with `NEXT_PUBLIC_SUPABASE_URL=https://localhost`,
   the **local** publishable key, `SUPABASE_URL_INTERNAL` set to
   `http://host.docker.internal:54321`, and `APP_URL=https://localhost`.
   The deploy script refuses a hosted Supabase URL. Do not copy staging or
   production credentials into this file.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/deploy-docker.ps1`,
   then open `https://localhost`. `http://localhost` should redirect to it.
   Local email is captured by the Supabase test inbox, not sent by Resend.

The certificate and private key are local-only. Recreate them when they expire
or when moving to a new machine; never copy the mkcert CA key to Git or CI.
`NET::ERR_CERT_AUTHORITY_INVALID` means the local CA was not trusted on that
machine or the certificate hostname differs. Regenerate/trust it; do not
disable verification.

## Authentication and security

App URLs come from the selected environment parameter file. Registration,
recovery, and LINE post-login redirects use that configured origin, not the
current request host. Local Supabase Auth Site URL and app redirects are now
`https://localhost`; Staging's are on
`https://staging.langsuanapp.com`. The LINE provider callback is the **Supabase
Auth** callback, not `/auth/callback` on the app. Verify any LINE Developers
Console changes separately. The staging Resend Auth Hook continues to generate
only staging HTTPS links and retains its strict recipient allowlist. Production
email delivery was not modified.

Supabase SSR session cookies are `Secure; SameSite=Lax`. They are readable by
browser JavaScript as required by the current `@supabase/ssr` browser client;
setting `HttpOnly` there would break client-side session refresh. Reassess
that architecture before claiming HttpOnly. Responses declare `nosniff`, a
referrer policy, a permissions policy, and a narrowly scoped CSP covering
frame ancestry, objects, and base URIs. HSTS is deliberately **not enabled**
yet; do not add `preload` without a separate decision and subdomain audit.

## Validation and release sequence

Run `npm run validate:local`, `npm run validate:staging`,
`npm run validate:production`, `npm test`, `npm run typecheck`, and the build.
`npm run smoke:https:staging` checks a public HTTP→HTTPS redirect, trusted TLS,
login/health, headers, and obvious cross-environment URL leakage. It is in the
staging deployment workflow. `npm run auth:audit:production` reads only the
remote Production Supabase Auth URL and delivery policy and needs a scoped
`auth_config_read` token; the Production workflow runs it before build. Production workflow checks Staging first and
checks Production after deployment, but manual auth, email, and browser checks
are still required. Do not promote while any HTTPS smoke gate fails.

Before Production: confirm root versus `app` canonical host; verify Cloudflare
edge certificate and redirect ownership, inspect TLS minimum/version and SSL
mode in the zone, validate exact Supabase and LINE URLs, test signup,
confirmation, recovery, LINE login, session persistence, mobile layout, and
mixed content in a real browser. Keep HSTS off until all subdomains are
audited. Record a last-good Worker version and remote Auth settings. Roll back
the Worker and its own config first; do not weaken TLS or repoint DNS to
Staging. A root-domain migration additionally needs a reviewed root Worker
rollback plan.

## Troubleshooting

- Redirect loop: inspect Cloudflare rules and app redirects; only Cloudflare
  should own public HTTP→HTTPS. Flexible SSL is not a workaround.
- 525/526: inspect the origin TLS certificate **only if** using a separate
  origin server; Workers custom domains have Cloudflare-managed TLS.
- Mixed content: inspect browser Network/Console for HTTP API or assets; local
  browser Supabase must resolve through `https://localhost`.
- OAuth mismatch or Supabase redirect rejection: compare exact Site URL,
  Redirect URL allowlist, and LINE's Supabase callback for that environment.
- Secure cookie missing: verify the page and redirect chain stay on HTTPS and
  that cookie `SameSite=Lax` permits the OAuth return.
- Wrong-environment link: inspect the selected parameter file, Supabase Auth
  remote Site/Redirect URLs, and (for Staging) the Resend Auth Hook. Never fix
  it by adding localhost or Production to the Staging allowlist.
