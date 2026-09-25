# Docker: local manual deployment

The normal local path now runs the standard Next.js server behind Caddy at
`https://localhost`. Start with [HTTPS/TLS setup](HTTPS_TLS.md); the direct
HTTP Docker commands later in this document are legacy troubleshooting steps
and bypass TLS. The app is separate from the
Vinext/Cloudflare Worker commands in `package.json`.

The container is intended for local or self-hosted deployment. It does not
make the application production-ready: follow `docs/RELEASE-CHECKLIST.md`
before exposing it publicly.

## Prerequisites

- Docker Desktop is running and the `desktop-linux` context is available.
- Docker Compose v2 is installed (`docker compose version`).
- Node.js 22+ is used for non-container commands.
- A Supabase project appropriate for the environment is configured. Do not
  use local fixture credentials or a service-role key.

## Configure public environment values

The Supabase URL and publishable key are public browser values, but should
still be supplied per environment. Copy the example and fill in both values:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

`NEXT_PUBLIC_*` values are embedded in the client bundle during `next build`.
They are therefore passed both as Docker build arguments and container runtime
environment variables. Rebuild the image whenever either value changes.

When Supabase runs locally on Docker Desktop, use
`NEXT_PUBLIC_SUPABASE_URL=https://localhost` so the host browser reaches
Supabase through the HTTPS proxy. Also set
`SUPABASE_URL_INTERNAL=http://host.docker.internal:54321` so server-side
requests from the web container reach the host's Supabase stack. The internal
value is not bundled into browser JavaScript.

Never place `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, Docker build
arguments, Compose, or browser-facing variables.

## Build and run with Compose

Use the deploy script for the normal local deployment. It validates the public
Supabase values, starts Docker Desktop if needed, builds the image, recreates
the service, and waits for an HTTP 200 response:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-docker.ps1
```

Pass a different environment file or extend the Docker startup wait when
needed:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-docker.ps1 `
  -EnvFile .env.staging `
  -StartupTimeoutSeconds 180
```

The equivalent commands remain available for troubleshooting or environments
where the script cannot be used:

```powershell
docker compose --env-file .env.local up --build -d
docker compose ps
docker compose logs --follow web
```

Open `https://localhost`. Caddy binds only to `127.0.0.1`, and the web port is
not published to the host. Stop following logs with `Ctrl+C`; the container
continues to run in the background.

## Manual Docker commands

Use these when Compose is not desired:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" `
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key" `
  --tag langsuan-web:local .

docker run --detach --name langsuan-web `
  --publish 127.0.0.1:3000:3000 `
  --env-file .env.local `
  --restart unless-stopped `
  langsuan-web:local
```

## Verify, update, and roll back

```powershell
# Check status and application logs
docker compose ps
docker compose logs --tail 100 web

# Rebuild and replace the running container after source or public env changes
docker compose --env-file .env.local up --build -d

# Stop and remove the local deployment (the image is retained)
docker compose down

# Stop and remove the container created with docker run
docker rm --force langsuan-web

# Return to a previously tagged image, if one was retained
docker rm --force langsuan-web
docker run --detach --name langsuan-web --publish 127.0.0.1:3000:3000 --env-file .env.local previous-image:tag
```

## Related commands

```powershell
# Local source development
npm.cmd run dev

# Local validation
npm.cmd run typecheck
npm.cmd test
npm.cmd run build

# Cloudflare Worker build/deploy path (not Docker)
npm.cmd run build:vinext
npm.cmd run deploy:vinext
```

The Cloudflare deploy command requires its own authenticated Cloudflare account
and deployment configuration; it does not deploy this Docker image.

## Local email confirmation

Email confirmation is enabled in `supabase/config.toml`. The local Supabase
stack uses Inbucket/Mailpit, so confirmation messages are captured for testing
and are not delivered to real inboxes.

Start the local Supabase services (including Auth and Inbucket) before testing
registration or confirmation:

```powershell
npx.cmd supabase start
npx.cmd supabase status
```

After a user registers at `https://localhost/register`, open
`http://localhost:54324` to view the confirmation message and follow its link.
The registered user cannot sign in with a password until that link is opened.

For the Dockerized web server, keep these local values in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://localhost
SUPABASE_URL_INTERNAL=http://host.docker.internal:54321
```

The first address is used by browser code on the host; the second is used only
by server-side code inside the web container. Confirm service health with:

```powershell
npx.cmd supabase status
docker compose --env-file .env.local ps
```

Stop the local Supabase stack when it is no longer needed:

```powershell
npx.cmd supabase stop
```

For a hosted deployment, configure the hosted Supabase project's Auth site
URL, redirect allow-list, confirmation template, and trusted SMTP provider.
Do not expose a service-role key through Docker build arguments, Compose, or
browser-facing environment variables.
