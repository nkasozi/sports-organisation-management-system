export const SERVICE_WORKER_STRATEGY = {
  PASS_THROUGH: "pass_through",
  CACHE_FIRST: "cache_first",
  NETWORK_FIRST: "network_first",
  NAVIGATION_WITH_SHELL_FALLBACK: "navigation_with_shell_fallback",
} as const;

type ServiceWorkerStrategy =
  (typeof SERVICE_WORKER_STRATEGY)[keyof typeof SERVICE_WORKER_STRATEGY];

interface ServiceWorkerRequestDescriptor {
  url: string;
  method: string;
  mode: string;
}

export interface ServiceWorkerRoutingContext {
  app_origin: string;
  precached_paths: ReadonlySet<string>;
  passthrough_path_prefixes: readonly string[];
}

const READ_METHOD = "GET";
const NAVIGATE_MODE = "navigate";
const IMMUTABLE_ASSET_PREFIX = "/_app/immutable/";
const CACHE_NAME_PREFIX = "sport-sync-app-";
const OWNED_CACHE_NAME_PREFIXES = [CACHE_NAME_PREFIX, "sports-org-"] as const;

type ParsedRequestUrl = { is_valid: true; url: URL } | { is_valid: false };

const REQUEST_URL_PARSE_FAILED_EVENT = "service_worker_request_url_invalid";

function parse_request_url(raw_url: string): ParsedRequestUrl {
  try {
    return { is_valid: true, url: new URL(raw_url) };
  } catch (error) {
    console.warn("[ServiceWorker] Request URL could not be parsed", {
      event: REQUEST_URL_PARSE_FAILED_EVENT,
      error: String(error),
    });
    return { is_valid: false };
  }
}

function is_passthrough_path(
  pathname: string,
  context: ServiceWorkerRoutingContext,
): boolean {
  return context.passthrough_path_prefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function classify_same_origin_read(
  pathname: string,
  mode: string,
  context: ServiceWorkerRoutingContext,
): ServiceWorkerStrategy {
  if (is_passthrough_path(pathname, context))
    return SERVICE_WORKER_STRATEGY.PASS_THROUGH;
  if (context.precached_paths.has(pathname))
    return SERVICE_WORKER_STRATEGY.CACHE_FIRST;
  if (pathname.startsWith(IMMUTABLE_ASSET_PREFIX))
    return SERVICE_WORKER_STRATEGY.CACHE_FIRST;
  return mode === NAVIGATE_MODE
    ? SERVICE_WORKER_STRATEGY.NAVIGATION_WITH_SHELL_FALLBACK
    : SERVICE_WORKER_STRATEGY.NETWORK_FIRST;
}

export function classify_service_worker_request(
  request: ServiceWorkerRequestDescriptor,
  context: ServiceWorkerRoutingContext,
): ServiceWorkerStrategy {
  if (request.method !== READ_METHOD)
    return SERVICE_WORKER_STRATEGY.PASS_THROUGH;
  const parsed_url = parse_request_url(request.url);
  if (!parsed_url.is_valid) return SERVICE_WORKER_STRATEGY.PASS_THROUGH;
  if (parsed_url.url.origin !== context.app_origin)
    return SERVICE_WORKER_STRATEGY.PASS_THROUGH;
  return classify_same_origin_read(
    parsed_url.url.pathname,
    request.mode,
    context,
  );
}

export function build_service_worker_cache_name(version: string): string {
  return `${CACHE_NAME_PREFIX}${version}`;
}

export function list_stale_service_worker_caches(
  cache_names: readonly string[],
  current_cache_name: string,
): string[] {
  return cache_names.filter(
    (cache_name) =>
      cache_name !== current_cache_name &&
      OWNED_CACHE_NAME_PREFIXES.some((prefix) => cache_name.startsWith(prefix)),
  );
}
