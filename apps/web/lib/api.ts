// Centralized API fetch helper — attaches Authorization header from localStorage at call time
export type ApiFetchOptions = RequestInit & {
  retryOn401?: boolean;
  throwOnError?: boolean;
};

const getToken = /**
 * Executes get token operation.
 * @returns {string} Description of return value
 */
() => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

/**
 * Performs parse json safe operation.
 * @param {Response} res - Description of res
 * @returns {Promise<any>} Description of return value
 */
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

/**
 * Performs api fetch operation.
 * @param {RequestInfo} input - Description of input
 * @param {import("/Users/nalindalal/modheshwari/apps/web/lib/api").ApiFetchOptions} init - Description of init
 * @returns {Promise<any>} Description of return value
 */
export async function apiFetch(input: RequestInfo, init?: ApiFetchOptions) {
  const headers = new Headers((init?.headers as HeadersInit) || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // If body looks like JSON and no content-type set, set it
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });
  const data = await parseJsonSafe(res);

  const throwOnError = init?.throwOnError ?? true;

  // If unauthorized, try silent refresh
  // Use a local variable to track retry state, not in fetch init
  const alreadyRetried =
    (init as unknown as { retryOn401?: boolean })?.retryOn401 === true;
  if (res.status === 401 && !alreadyRetried) {
    try {
      const refreshRes = await fetch(
        `${typeof window !== "undefined" && window.location.origin ? window.location.origin : ""}/api/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const refreshData = await parseJsonSafe(refreshRes);
      const newToken = refreshData?.data?.accessToken;
      if (refreshRes.ok && newToken) {
        localStorage.setItem("token", newToken);
        // Retry original request with new token
        const retryHeaders = new Headers((init?.headers as HeadersInit) || {});
        retryHeaders.set("Authorization", `Bearer ${newToken}`);
        if (
          init?.body &&
          !(init.body instanceof FormData) &&
          !retryHeaders.has("Content-Type")
        ) {
          retryHeaders.set("Content-Type", "application/json");
        }
        // Remove retryOn401 from fetch call, use only in apiFetch
        const retryInit = { ...init, headers: retryHeaders } as RequestInit;
        // Call apiFetch recursively with retryOn401 flag
        return await apiFetch(input, {
          ...retryInit,
          retryOn401: true,
        } as ApiFetchOptions);
      }
    } catch {
      // Ignore refresh errors, proceed to error handling
    }
  }

  if (!res.ok) {
    if (!throwOnError) {
      return { ok: false, status: res.status, data };
    }
    const err = new Error(
      (data && (data.message || data.error)) ||
        res.statusText ||
        "Request failed",
    ) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const apiGet = /**
 * Executes api get operation.
 * @param {string} url - Description of url
 * @param {import("/Users/nalindalal/modheshwari/apps/web/lib/api").ApiFetchOptions} opts - Description of opts
 * @returns {Promise<any>} Description of return value
 */
(url: string, opts?: ApiFetchOptions) =>
  apiFetch(url, { ...opts, method: "GET" });
export const apiPost = /**
 * Executes api post operation.
 * @param {string} url - Description of url
 * @param {unknown} body - Description of body
 * @param {import("/Users/nalindalal/modheshwari/apps/web/lib/api").ApiFetchOptions} opts - Description of opts
 * @returns {Promise<any>} Description of return value
 */
(url: string, body?: unknown, opts?: ApiFetchOptions) =>
  apiFetch(url, {
    ...opts,
    method: "POST",
    body: body && typeof body === "string" ? body : JSON.stringify(body),
  });
export const apiPut = /**
 * Executes api put operation.
 * @param {string} url - Description of url
 * @param {unknown} body - Description of body
 * @param {import("/Users/nalindalal/modheshwari/apps/web/lib/api").ApiFetchOptions} opts - Description of opts
 * @returns {Promise<any>} Description of return value
 */
(url: string, body?: unknown, opts?: ApiFetchOptions) =>
  apiFetch(url, {
    ...opts,
    method: "PUT",
    body: body && typeof body === "string" ? body : JSON.stringify(body),
  });
export const apiDelete = /**
 * Executes api delete operation.
 * @param {string} url - Description of url
 * @param {import("/Users/nalindalal/modheshwari/apps/web/lib/api").ApiFetchOptions} opts - Description of opts
 * @returns {Promise<any>} Description of return value
 */
(url: string, opts?: ApiFetchOptions) =>
  apiFetch(url, { ...opts, method: "DELETE" });

export default apiFetch;
