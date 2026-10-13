const OPTION_STATUS = Object.freeze({ SOME: "some", NONE: "none" });

const CLERK_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_([A-Za-z0-9+/]+={0,2})$/;
const CLERK_FRONTEND_API_TERMINATOR = "$";
const HOSTNAME_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const HTTPS_PROTOCOL = "https:";
const BASE64_GROUP_LENGTH = 4;
const INVALID_BASE64_REMAINDER = 1;

const CLERK_SOURCES = Object.freeze([
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
]);
const CLERK_BOT_PROTECTION_SOURCE = "https://challenges.cloudflare.com";
const CLERK_TELEMETRY_SOURCE = "https://clerk-telemetry.com";
const CLERK_IMAGE_SOURCE = "https://img.clerk.com";
const CONVEX_SOURCES = Object.freeze([
  "https://*.convex.cloud",
  "wss://*.convex.cloud",
  "https://*.convex.site",
]);
const VERCEL_ANALYTICS_SOURCE = "https://va.vercel-scripts.com";

function create_some_option(value) {
  return { status: OPTION_STATUS.SOME, value };
}

function create_none_option() {
  return { status: OPTION_STATUS.NONE };
}

function decode_clerk_frontend_api_host(encoded_frontend_api) {
  const decoded_value = atob(encoded_frontend_api);
  if (!decoded_value.endsWith(CLERK_FRONTEND_API_TERMINATOR)) return "";
  return decoded_value.slice(0, -CLERK_FRONTEND_API_TERMINATOR.length);
}

export function resolve_clerk_frontend_api_origin(publishable_key) {
  const key_match = CLERK_PUBLISHABLE_KEY_PATTERN.exec(
    String(publishable_key ?? "").trim(),
  );
  if (
    !key_match ||
    key_match[2].length % BASE64_GROUP_LENGTH === INVALID_BASE64_REMAINDER
  ) {
    return create_none_option();
  }
  const frontend_api_host = decode_clerk_frontend_api_host(key_match[2]);
  return HOSTNAME_PATTERN.test(frontend_api_host)
    ? create_some_option(`https://${frontend_api_host}`)
    : create_none_option();
}

function resolve_https_origin(raw_url) {
  const normalized_url = String(raw_url ?? "").trim();
  if (!URL.canParse(normalized_url)) return create_none_option();
  const parsed_url = new URL(normalized_url);
  return parsed_url.protocol === HTTPS_PROTOCOL
    ? create_some_option(parsed_url.origin)
    : create_none_option();
}

function collect_configured_clerk_origins(public_environment) {
  return [
    resolve_clerk_frontend_api_origin(
      public_environment.PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    resolve_https_origin(public_environment.PUBLIC_CLERK_PROXY_URL),
    resolve_https_origin(public_environment.PUBLIC_CLERK_JS_URL),
  ].flatMap((origin_option) =>
    origin_option.status === OPTION_STATUS.SOME ? [origin_option.value] : [],
  );
}

function unique_sources(sources) {
  return [...new Set(sources)];
}

export function build_content_security_policy_directives(public_environment) {
  const clerk_origins = unique_sources([
    ...CLERK_SOURCES,
    ...collect_configured_clerk_origins(public_environment ?? {}),
  ]);
  return {
    "default-src": ["self"],
    "script-src": unique_sources([
      "self",
      ...clerk_origins,
      CLERK_BOT_PROTECTION_SOURCE,
      VERCEL_ANALYTICS_SOURCE,
    ]),
    "style-src": ["self", "unsafe-inline"],
    "font-src": ["self", "data:"],
    "img-src": ["self", "data:", "blob:", "https:", CLERK_IMAGE_SOURCE],
    "connect-src": unique_sources([
      "self",
      ...CONVEX_SOURCES,
      ...clerk_origins,
      CLERK_TELEMETRY_SOURCE,
      VERCEL_ANALYTICS_SOURCE,
    ]),
    "frame-src": unique_sources([
      "self",
      ...clerk_origins,
      CLERK_BOT_PROTECTION_SOURCE,
    ]),
    "worker-src": ["self", "blob:"],
    "manifest-src": ["self"],
    "object-src": ["none"],
    "base-uri": ["self"],
    "form-action": ["self"],
    "frame-ancestors": ["none"],
  };
}
