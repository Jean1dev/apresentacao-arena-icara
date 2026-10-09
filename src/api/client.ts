import { env } from "../config/env";
import type { ErrorBody, FieldError } from "./types";

const TIMEOUT_MS = 15_000;

/** Códigos gerados no cliente, fora do envelope de erro da API. */
export const NETWORK_ERROR = "NETWORK_ERROR";
export const TIMEOUT = "TIMEOUT";
export const UNEXPECTED_RESPONSE = "UNEXPECTED_RESPONSE";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Erro do cliente (4xx): repetir a mesma requisição não adianta. */
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

export function buildUrl(path: string, query?: RequestOptions["query"]) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, value);
  }
  const qs = params.toString();
  return `${env.apiBaseUrl}${path}${qs ? `?${qs}` : ""}`;
}

export async function request<T>(path: string, { method = "GET", query, body, signal }: RequestOptions = {}): Promise<T> {
  // Junta o cancelamento do chamador (TanStack Query) com o timeout.
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timedOut) throw new ApiError(0, TIMEOUT, "a API demorou para responder");
    throw new ApiError(0, NETWORK_ERROR, "não foi possível falar com a API");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }

  const payload = await res.json().catch(() => undefined);
  if (!res.ok) {
    const error = (payload as ErrorBody | undefined)?.error;
    throw new ApiError(res.status, error?.code ?? UNEXPECTED_RESPONSE, error?.message ?? `HTTP ${res.status}`, error?.fields ?? []);
  }
  if (payload === undefined) throw new ApiError(res.status, UNEXPECTED_RESPONSE, "resposta sem JSON");
  return payload as T;
}
