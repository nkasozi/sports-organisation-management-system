import type { Option } from "$lib/core/types/Option";

export type ContentSecurityPolicyPublicEnvironment = Partial<
  Record<
    | "PUBLIC_CLERK_PUBLISHABLE_KEY"
    | "PUBLIC_CLERK_PROXY_URL"
    | "PUBLIC_CLERK_JS_URL",
    string
  >
>;

export type ContentSecurityPolicyDirectives = Record<string, string[]>;

export function resolve_clerk_frontend_api_origin(
  publishable_key: string,
): Option<string>;

export function build_content_security_policy_directives(
  public_environment: ContentSecurityPolicyPublicEnvironment,
): ContentSecurityPolicyDirectives;
