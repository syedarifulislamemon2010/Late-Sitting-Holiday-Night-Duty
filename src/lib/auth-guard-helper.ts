export function evaluateAuthResponse(
  status: number,
  contentType: string | null,
  data: { authenticated?: boolean; user?: unknown } | null,
  currentAuthenticated: boolean | null
): { authenticated: boolean | null; shouldUpdate: boolean; logWarn?: string } {
  // If response is successful JSON
  if (status >= 200 && status < 300 && contentType && contentType.includes('application/json') && data) {
    if (data.authenticated) {
      return { authenticated: true, shouldUpdate: true };
    } else {
      return { authenticated: false, shouldUpdate: true };
    }
  }

  // Explicit unauthenticated 401
  if (status === 401) {
    return { authenticated: false, shouldUpdate: true };
  }

  // Rate limiting (429) - skip cycle, preserve current state
  if (status === 429) {
    return { authenticated: currentAuthenticated, shouldUpdate: false, logWarn: 'Auth check rate limited, skipping cycle' };
  }

  // Server errors (500, 502, 503, 504) or bad gateway/non-JSON responses:
  // If user is already authenticated, DO NOT log them out, skip cycle to prevent loss of work
  if (status >= 500 && status <= 599) {
    return {
      authenticated: currentAuthenticated === null ? false : currentAuthenticated,
      shouldUpdate: currentAuthenticated === null,
      logWarn: `Auth verification encountered server error (${status}), skipping cycle`
    };
  }

  // Any non-JSON response or unexpected response:
  // If already authenticated, do not log out on transient non-JSON response (e.g. proxy HTML error page)
  if (!contentType || !contentType.includes('application/json')) {
    return {
      authenticated: currentAuthenticated === null ? false : currentAuthenticated,
      shouldUpdate: currentAuthenticated === null,
      logWarn: 'Auth verification returned non-JSON response, skipping cycle'
    };
  }

  // Fallback for other status codes (e.g. 403)
  return { authenticated: false, shouldUpdate: true };
}
