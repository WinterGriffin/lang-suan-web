# LINE Login — MVP 1.5 configuration

LangSuan uses Supabase Auth as the OAuth/OIDC relying party. The web client calls
`signInWithOAuth` with the centralized provider identifier `custom:line`; it does
not exchange LINE authorization codes, create sessions, or store provider tokens
itself. Supabase owns `auth.users` and `auth.identities`; `public.profiles` remains
application profile data.

## One-time hosted Supabase setup

1. In **Authentication → Auth Providers**, create a Custom OAuth/OIDC provider
   with identifier `custom:line`.
2. Choose manual OAuth2. Configure `https://access.line.me/oauth2/v2.1/authorize`
   as the authorization endpoint, `https://api.line.me/oauth2/v2.1/token` as the
   token endpoint, and `https://api.line.me/oauth2/v2.1/userinfo` as the userinfo
   endpoint. Enable PKCE and request `openid profile`. Enter the LINE Channel ID
   and Channel Secret in Supabase only.
3. Copy the callback URL displayed by Supabase and register that exact URL in the
   LINE Developers Console for the LINE Login channel.
4. In **Authentication â†’ URL Configuration**, set the Site URL to the canonical
   application origin and add the exact post-login callback URL to Redirect URLs.
   For this Docker-local deployment, these are
   `http://localhost:3000` and `http://localhost:3000/auth/callback`.
   `http://127.0.0.1:3000/auth/callback` is also allowed for direct loopback
   testing. Do not use `http://0.0.0.0:3000`: it is a bind address, not a browser
   URL. If the exact callback is absent, Supabase falls back to its Site URL after
   completing the external-provider flow.
5. Request only `openid profile`. LINE email permission is optional and requires
   LINE approval; without a verified shared email, users may need future manual
   identity linking rather than automatic linking.

## Security contract

- No LINE password, Channel Secret, authorization code, access token, or refresh
  token is exposed in browser code or committed to this repository.
- Supabase validates the OAuth/OIDC flow, state/PKCE, token exchange, session, and
  identity storage. The callback only exchanges the Supabase PKCE code and ensures
  an application profile exists.
- Invalid/missing callback codes return to Login with an error, without creating a
  session.
- Existing email/password signup, email confirmation, login, and the shared SSR
  session cookie remain unchanged.

## Local testing

LINE requires a reachable HTTPS callback. Use a temporary HTTPS tunnel that points
to the local web service, register its Supabase callback URL with the LINE channel,
then add the tunnel host to Supabase redirect allow-lists. Do not put a Channel
Secret in `.env.local`, `compose.yaml`, or browser variables.

There are no new application environment variables. LINE credentials belong in the
Supabase Custom Provider configuration, not in Next.js.

Set `APP_URL=http://localhost:3000` for Docker-local deployment. Route Handlers
use this browser-facing URL for the final callback redirect instead of the
container listen address. For a real hosted deployment, set it to that deployment's
HTTPS origin and register the matching `/auth/callback` URL in Supabase.

For Docker-local testing, open `http://localhost:3000`, not
`http://0.0.0.0:3000`. `0.0.0.0` is a Docker listen address, and browsers reject
it before this application can load or redirect it. The hosted provider uses
manual OAuth2 and LINE's userinfo endpoint rather than Custom OIDC discovery to
avoid a known LINE Web Login / generic OIDC-provider interoperability issue
during external-profile retrieval.
