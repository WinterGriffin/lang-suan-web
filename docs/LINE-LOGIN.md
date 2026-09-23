# LINE Login — MVP 1.5 configuration

LangSuan uses Supabase Auth as the OAuth/OIDC relying party. The web client calls
`signInWithOAuth` with the centralized provider identifier `custom:line`; it does
not exchange LINE authorization codes, create sessions, or store provider tokens
itself. Supabase owns `auth.users` and `auth.identities`; `public.profiles` remains
application profile data.

## One-time hosted Supabase setup

1. In **Authentication → Auth Providers**, create a Custom OAuth/OIDC provider
   with identifier `custom:line`.
2. Choose manual OAuth2 configuration unless the configured LINE channel supplies
   a supported OIDC discovery endpoint. Enter the LINE Channel ID and Channel
   Secret in Supabase only.
3. Copy the callback URL displayed by Supabase and register that exact URL in the
   LINE Developers Console for the LINE Login channel.
4. Allow the deployed `https://<app-host>/auth/callback` in Supabase Auth URL
   configuration. It is the post-Supabase redirect consumed by this app.
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
