import type { Option } from "$lib/core/types/Option";

export type ContentSecurityPolicyPublicEnvironment = Partial<
  Record<
    | "PUBLIC_CLERK_PUBLISHABLE_KEY"
    | "PUBLIC_CLERK_PROXY_URL"
    | "PUBLIC_CLERK_JS_URL"
    | "PUBLIC_CONVEX_URL",
    string
  >
>;

export declare const CSP_DEPLOYMENT_MODE: Readonly<{
  DEVELOPMENT: "development";
  PRODUCTION: "production";
}>;

export type CspDeploymentMode =
  (typeof CSP_DEPLOYMENT_MODE)[keyof typeof CSP_DEPLOYMENT_MODE];

export type ContentSecurityPolicyDirectives = Record<string, string[]>;

export function resolve_clerk_frontend_api_origin(
  publishable_key: string,
): Option<string>;

export function build_content_security_policy_directives(
  public_environment: ContentSecurityPolicyPublicEnvironment,
  deployment_mode?: CspDeploymentMode,
): ContentSecurityPolicyDirectives;
