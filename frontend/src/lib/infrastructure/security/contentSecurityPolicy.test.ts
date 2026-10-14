import { describe, expect, it } from "vitest";

import {
  build_content_security_policy_directives,
  CSP_DEPLOYMENT_MODE,
  resolve_clerk_frontend_api_origin,
} from "./contentSecurityPolicy.js";

const LIVE_PUBLISHABLE_KEY = "pk_live_Y2xlcmsuc3BvcnRzeW5jLmV4YW1wbGUk";
const TEST_PUBLISHABLE_KEY =
  "pk_test_ZXhhbXBsZS1hcHAtMTIuY2xlcmsuYWNjb3VudHMuZGV2JA==";

describe("resolve_clerk_frontend_api_origin", () => {
  it("decodes the production frontend api host from a live publishable key", () => {
    expect(resolve_clerk_frontend_api_origin(LIVE_PUBLISHABLE_KEY)).toEqual({
      status: "some",
      value: "https://clerk.sportsync.example",
    });
  });

  it("decodes the development frontend api host from a test publishable key", () => {
    expect(resolve_clerk_frontend_api_origin(TEST_PUBLISHABLE_KEY)).toEqual({
      status: "some",
      value: "https://example-app-12.clerk.accounts.dev",
    });
  });

  it("decodes a publishable key whose base64 payload omits padding", () => {
    expect(
      resolve_clerk_frontend_api_origin(
        TEST_PUBLISHABLE_KEY.replace(/=+$/, ""),
      ),
    ).toEqual({
      status: "some",
      value: "https://example-app-12.clerk.accounts.dev",
    });
  });

  it.each([
    "",
    "not-a-key",
    "pk_test_a",
    "pk_live_",
    "pk_live_!!!!",
    "pk_live_aGVsbG8gd29ybGQ=",
  ])("returns none for an unusable key %j", (publishable_key: string) => {
    expect(resolve_clerk_frontend_api_origin(publishable_key)).toEqual({
      status: "none",
    });
  });
});

describe("build_content_security_policy_directives", () => {
  it("allows the configured Clerk frontend api for scripts, connections and frames", () => {
    const directives = build_content_security_policy_directives({
      PUBLIC_CLERK_PUBLISHABLE_KEY: LIVE_PUBLISHABLE_KEY,
    });

    expect(directives["script-src"]).toContain(
      "https://clerk.sportsync.example",
    );
    expect(directives["connect-src"]).toContain(
      "https://clerk.sportsync.example",
    );
    expect(directives["frame-src"]).toContain(
      "https://clerk.sportsync.example",
    );
  });

  it("allows the Clerk bot protection challenge and the Convex backend", () => {
    const directives = build_content_security_policy_directives({});

    expect(directives["script-src"]).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(directives["frame-src"]).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(directives["connect-src"]).toEqual(
      expect.arrayContaining([
        "https://*.convex.cloud",
        "wss://*.convex.cloud",
      ]),
    );
  });

  it("allows remote https, data and blob images for user supplied logos", () => {
    const directives = build_content_security_policy_directives({});

    expect(directives["img-src"]).toEqual(
      expect.arrayContaining(["self", "data:", "blob:", "https:"]),
    );
  });

  it("locks down plugins, base uri and framing", () => {
    const directives = build_content_security_policy_directives({});

    expect(directives["object-src"]).toEqual(["none"]);
    expect(directives["base-uri"]).toEqual(["self"]);
    expect(directives["frame-ancestors"]).toEqual(["none"]);
    expect(directives["script-src"]).not.toContain("unsafe-inline");
    expect(directives["script-src"]).not.toContain("unsafe-eval");
  });

  it("adds a configured Clerk proxy origin and ignores a malformed one", () => {
    const with_proxy = build_content_security_policy_directives({
      PUBLIC_CLERK_PROXY_URL: "https://app.example.test/__clerk",
    });
    const with_malformed_proxy = build_content_security_policy_directives({
      PUBLIC_CLERK_PROXY_URL: "javascript:alert(1)",
    });

    expect(with_proxy["script-src"]).toContain("https://app.example.test");
    expect(with_malformed_proxy["script-src"]).not.toContain(
      "javascript:alert(1)",
    );
  });

  it("allows the configured Convex deployment over https and wss", () => {
    const directives = build_content_security_policy_directives({
      PUBLIC_CONVEX_URL: "https://convex.sportsync.example/",
    });

    expect(directives["connect-src"]).toEqual(
      expect.arrayContaining([
        "https://convex.sportsync.example",
        "wss://convex.sportsync.example",
      ]),
    );
  });

  it("ignores a Convex url that is not https", () => {
    const directives = build_content_security_policy_directives({
      PUBLIC_CONVEX_URL: "http://convex.sportsync.example",
    });

    expect(directives["connect-src"]).not.toContain(
      "http://convex.sportsync.example",
    );
    expect(directives["connect-src"]).not.toContain(
      "ws://convex.sportsync.example",
    );
  });

  it("keeps Clerk development wildcards out of production scripts", () => {
    const directives = build_content_security_policy_directives(
      { PUBLIC_CLERK_PUBLISHABLE_KEY: LIVE_PUBLISHABLE_KEY },
      CSP_DEPLOYMENT_MODE.PRODUCTION,
    );

    expect(directives["script-src"]).toContain(
      "https://clerk.sportsync.example",
    );
    expect(directives["script-src"]).not.toContain(
      "https://*.clerk.accounts.dev",
    );
    expect(directives["script-src"]).not.toContain("https://*.clerk.com");
  });

  it("treats a missing deployment mode as production", () => {
    const directives = build_content_security_policy_directives({});

    expect(directives["script-src"]).not.toContain(
      "https://*.clerk.accounts.dev",
    );
  });

  it("allows Clerk development wildcards only in development", () => {
    const directives = build_content_security_policy_directives(
      {},
      CSP_DEPLOYMENT_MODE.DEVELOPMENT,
    );

    expect(directives["script-src"]).toEqual(
      expect.arrayContaining([
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
      ]),
    );
  });

  it("lets the same-origin service worker register", () => {
    const directives = build_content_security_policy_directives({});

    expect(directives["worker-src"]).toContain("self");
  });
});
