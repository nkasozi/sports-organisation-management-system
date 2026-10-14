import { type Option, OptionStatus } from "$lib/core/types/Option";
import type { AsyncResult } from "$lib/core/types/Result";

export interface ServiceWorkerStrategyPorts {
  match_cached(key: string): Promise<Option<Response>>;
  store_in_cache(key: string, response: Response): Promise<boolean>;
  fetch_from_network(request: Request): AsyncResult<Response>;
  wait(milliseconds: number): Promise<void>;
  network_timeout_ms: number;
  shell_path: string;
}

const OFFLINE_STATUS_CODE = 503;
const OFFLINE_STATUS_TEXT = "Offline";
const OFFLINE_ASSET_BODY = "This file is not available offline yet.";
const OFFLINE_PAGE_BODY =
  "Sport-Sync is offline and this page has not been saved on this device yet. Reconnect once to make it available offline.";
const NETWORK_UNAVAILABLE_EVENT = "service_worker_network_unavailable";

const NETWORK_ATTEMPT_STATUS = {
  RESPONSE: "response",
  UNAVAILABLE: "unavailable",
} as const;

type NetworkAttempt =
  | { status: typeof NETWORK_ATTEMPT_STATUS.RESPONSE; response: Response }
  | { status: typeof NETWORK_ATTEMPT_STATUS.UNAVAILABLE };

function build_offline_response(body: string): Response {
  return new Response(body, {
    status: OFFLINE_STATUS_CODE,
    statusText: OFFLINE_STATUS_TEXT,
  });
}

async function fetch_and_cache(
  request: Request,
  cache_key: string,
  ports: ServiceWorkerStrategyPorts,
): Promise<NetworkAttempt> {
  const network_result = await ports.fetch_from_network(request);
  if (!network_result.success)
    return { status: NETWORK_ATTEMPT_STATUS.UNAVAILABLE };
  const response = network_result.data;
  if (response.ok) await ports.store_in_cache(cache_key, response.clone());
  return { status: NETWORK_ATTEMPT_STATUS.RESPONSE, response };
}

async function fetch_within_timeout(
  request: Request,
  ports: ServiceWorkerStrategyPorts,
): Promise<NetworkAttempt> {
  const timed_out: Promise<NetworkAttempt> = ports
    .wait(ports.network_timeout_ms)
    .then(() => ({ status: NETWORK_ATTEMPT_STATUS.UNAVAILABLE }));
  return Promise.race([
    fetch_and_cache(request, request.url, ports),
    timed_out,
  ]);
}

async function first_cached_response(
  keys: readonly string[],
  ports: ServiceWorkerStrategyPorts,
): Promise<Option<Response>> {
  for (const key of keys) {
    const cached = await ports.match_cached(key);
    if (cached.status === OptionStatus.SOME) return cached;
  }
  return { status: OptionStatus.NONE };
}

export async function respond_cache_first(
  request: Request,
  ports: ServiceWorkerStrategyPorts,
): Promise<Response> {
  const cached = await ports.match_cached(request.url);
  if (cached.status === OptionStatus.SOME) return cached.value;
  const attempt = await fetch_and_cache(request, request.url, ports);
  return attempt.status === NETWORK_ATTEMPT_STATUS.RESPONSE
    ? attempt.response
    : build_offline_response(OFFLINE_ASSET_BODY);
}

async function respond_from_network_then_cache(
  request: Request,
  fallback_keys: readonly string[],
  offline_body: string,
  ports: ServiceWorkerStrategyPorts,
): Promise<Response> {
  const attempt = await fetch_within_timeout(request, ports);
  if (attempt.status === NETWORK_ATTEMPT_STATUS.RESPONSE)
    return attempt.response;
  console.warn("[ServiceWorker] Network unavailable, serving saved copy", {
    event: NETWORK_UNAVAILABLE_EVENT,
    destination: request.destination,
  });
  const cached = await first_cached_response(fallback_keys, ports);
  return cached.status === OptionStatus.SOME
    ? cached.value
    : build_offline_response(offline_body);
}

export function respond_network_first(
  request: Request,
  ports: ServiceWorkerStrategyPorts,
): Promise<Response> {
  return respond_from_network_then_cache(
    request,
    [request.url],
    OFFLINE_ASSET_BODY,
    ports,
  );
}

export function respond_navigation_with_shell_fallback(
  request: Request,
  ports: ServiceWorkerStrategyPorts,
): Promise<Response> {
  return respond_from_network_then_cache(
    request,
    [request.url, ports.shell_path],
    OFFLINE_PAGE_BODY,
    ports,
  );
}
