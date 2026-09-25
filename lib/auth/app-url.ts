import { config } from "@/lib/config/env";

/**
 * Builds browser-facing redirects without deriving a host from the Docker
 * container request. `0.0.0.0` is valid for a server listen socket only.
 */
export function appUrl(pathname: string) {
  return new URL(pathname, config.app.baseUrl);
}
