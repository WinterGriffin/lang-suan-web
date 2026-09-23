# Docker: local manual deployment

This configuration runs the standard Next.js server in a small standalone
Node.js 22 container at `http://localhost:3000`. It is separate from the
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

When the Supabase URL is a local Docker Desktop service, do not use
`127.0.0.1` or `localhost`: those point back to the web container for
server-side requests. Use `http://host.docker.internal:54321` instead. Docker
Desktop resolves this hostname from both the container and the host browser.

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

Open `http://localhost:3000`. Stop following logs with `Ctrl+C`; the container
continues to run in the background.

## Manual Docker commands

Use these when Compose is not desired:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" `
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key" `
  --tag langsuan-web:local .

docker run --detach --name langsuan-web `
  --publish 3000:3000 `
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
docker run --detach --name langsuan-web --publish 3000:3000 --env-file .env.local previous-image:tag
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
