// shared/api/client.ts
import { API_V1 } from "@/shared/config/api";
import { ApiError, type ApiErrorShape } from "./types";

export type RefreshResult = {
  accessToken: string;
  refreshToken?: string;
} | null;

export type ApiClientOptions = {
  fetchImpl: typeof fetch;
  baseUrl?: string;
  getAccessToken?: () => string | null;
  refresh?: () => Promise<RefreshResult>;
  onAuthFailure?: () => void;
  nextConfig?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export type RequestOptions = {
  auth?: boolean;
  retry?: boolean;
  serverContext?: boolean;
  params?: Record<string, unknown>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiClient = {
  request<T>(
    path: string,
    init?: RequestInit,
    opt?: RequestOptions,
  ): Promise<T>;
  get<T>(path: string, opt?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, opt?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, opt?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, opt?: RequestOptions): Promise<T>;
  del<T>(path: string, opt?: RequestOptions): Promise<T>;
};

// ---------------- STATE ----------------
let client: ApiClient | null = null;
let optionsRef: ApiClientOptions | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;
const isServer = typeof window === "undefined";

// ---------------- HELPERS ----------------
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const errorData =
      data && typeof data === "object" ? (data as ApiErrorShape) : undefined;
    const message =
      errorData?.error ||
      errorData?.message ||
      res.statusText ||
      "Запрос не выполнен";

    throw new ApiError(String(message), res.status, data as ApiErrorShape);
  }

  return data as T;
}

async function getToken(): Promise<string | null> {
  if (!optionsRef) return null;
  return optionsRef.getAccessToken?.() ?? null;
}

async function refreshToken(): Promise<RefreshResult> {
  if (!optionsRef?.refresh) return null;

  if (refreshPromise) {
    try {
      return await refreshPromise;
    } catch {
      refreshPromise = null;
    }
  }

  refreshPromise = optionsRef.refresh().catch((error) => {
    refreshPromise = null;
    throw error;
  });

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function buildUrl(base: string, path: string, params?: Record<string, unknown>) {
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${base}${path.startsWith("/") ? "" : "/"}${path}`,
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// ---------------- BASE REQUEST ----------------
async function baseRequest<T>(
  fetchImpl: typeof fetch,
  base: string,
  path: string,
  init: RequestInit = {},
  opt: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(base, path, opt.params);

  const headers = new Headers(init.headers);

  if (opt.headers) {
    Object.entries(opt.headers).forEach(([k, v]) => headers.set(k, v));
  }

  // AUTH
  if (opt.auth) {
    const token = await getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (!opt.retry) {
      optionsRef?.onAuthFailure?.();
      throw new ApiError("No authentication token", 401);
    }
  }

  // BODY FIX
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (init.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  headers.set("Accept", "application/json");

  // NEXT только на сервере
  const nextConfig =
    isServer && (optionsRef?.nextConfig || opt.next)
      ? { ...optionsRef?.nextConfig, ...opt.next }
      : undefined;

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    signal: opt.signal,
    ...(nextConfig ? { next: nextConfig } : {}),
  };

  let res: Response;

  try {
    res = await fetchImpl(url, fetchOptions);
  } catch {
    throw new ApiError("Network error", 0, {
      error: "Network error",
      message: "Failed to fetch",
    });
  }

  // 🔁 REFRESH
  if (res.status === 401 && opt.auth && !opt.retry) {
    try {
      const refreshed = await refreshToken();

      if (refreshed?.accessToken) {
        return baseRequest<T>(fetchImpl, base, path, init, {
          ...opt,
          retry: true,
          headers: {
            ...opt.headers,
            Authorization: `Bearer ${refreshed.accessToken}`,
          },
        });
      }
    } catch {}

    optionsRef?.onAuthFailure?.();
    throw new ApiError("Unauthorized", 401);
  }

  return handleResponse<T>(res);
}

// ---------------- INIT ----------------
export function initApiClient(options: ApiClientOptions): void {
  optionsRef = options;
  const base = options.baseUrl ?? API_V1;
  const fetchImpl = options.fetchImpl;

  client = {
    request: (p, i, o) => baseRequest(fetchImpl, base, p, i, o),
    get: (p, o) => baseRequest(fetchImpl, base, p, { method: "GET" }, o),
    post: (p, body, o) =>
      baseRequest(
        fetchImpl,
        base,
        p,
        {
          method: "POST",
          body:
            body instanceof FormData || body === undefined
              ? body
              : JSON.stringify(body),
        },
        o,
      ),

    put: (p, body, o) =>
      baseRequest(
        fetchImpl,
        base,
        p,
        {
          method: "PUT",
          body:
            body instanceof FormData || body === undefined
              ? body
              : JSON.stringify(body),
        },
        o,
      ),

    patch: (p, body, o) =>
      baseRequest(
        fetchImpl,
        base,
        p,
        {
          method: "PATCH",
          body:
            body instanceof FormData || body === undefined
              ? body
              : JSON.stringify(body),
        },
        o,
      ),

    del: (p, o) => baseRequest(fetchImpl, base, p, { method: "DELETE" }, o),
  };
}

export function api(): ApiClient {
  if (!client) throw new Error("API not initialized");
  return client;
}

export function resetApiClient(): void {
  client = null;
  optionsRef = null;
  refreshPromise = null;
}
