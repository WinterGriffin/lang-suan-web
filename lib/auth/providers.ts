/**
 * Authentication providers are centralized so future providers do not leak
 * provider-specific behaviour into login screens.
 *
 * LINE is configured as a Supabase Custom OAuth/OIDC provider named
 * `custom:line`; the channel secret stays in Supabase, never this browser app.
 */
export const authProviders = {
  EMAIL: "email",
  LINE: "custom:line",
  GOOGLE: "google",
  FACEBOOK: "facebook",
  APPLE: "apple",
} as const;

export type AuthProvider = keyof typeof authProviders;
export const activeOAuthProviders = [authProviders.LINE] as const;
