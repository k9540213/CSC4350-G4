import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

// During SSR (e.g. the first full page load after the Google OAuth redirect),
// api.ts's fetch runs from the server process, not the browser, so the browser's
// cookie jar isn't attached automatically. This reads the incoming request's
// cookie header so it can be forwarded manually. On the client it's a no-op,
// since the browser already attaches cookies to same-site fetches itself.
export const getIncomingCookieHeader = createIsomorphicFn()
  .server(() => getRequestHeader("cookie"))
  .client(() => undefined as string | undefined);
