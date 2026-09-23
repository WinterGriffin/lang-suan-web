const localAppUrl = "http://localhost:3000";

/**
 * Builds browser-facing redirects without deriving a host from the Docker
 * container request. `0.0.0.0` is valid for a server listen socket only.
 */
export function appUrl(pathname: string) {
  const url = new URL(pathname, process.env.APP_URL?.trim() || localAppUrl);
  if (url.hostname === "0.0.0.0") url.hostname = "localhost";
  return url;
}
