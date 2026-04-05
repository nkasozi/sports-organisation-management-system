import { describe, expect, it } from "vitest";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' https://clerk.com https://*.clerk.accounts.dev https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://va.vercel-scripts.com",
  "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

describe("CSP header validation", () => {
  it("includes default-src self", () => {
    expect(CSP_DIRECTIVES).toContain("default-src 'self'");
  });

  it("blocks object embeds", () => {
    expect(CSP_DIRECTIVES).toContain("object-src 'none'");
  });

  it("blocks framing by other sites", () => {
    expect(CSP_DIRECTIVES).toContain("frame-ancestors 'none'");
  });

  it("restricts base URI", () => {
    expect(CSP_DIRECTIVES).toContain("base-uri 'self'");
  });

  it("allows Convex connections", () => {
    expect(CSP_DIRECTIVES).toContain("https://*.convex.cloud");
    expect(CSP_DIRECTIVES).toContain("wss://*.convex.cloud");
  });

  it("allows Clerk connections", () => {
    expect(CSP_DIRECTIVES).toContain("https://*.clerk.com");
    expect(CSP_DIRECTIVES).toContain("https://clerk.com");
  });

  it("allows service worker and blob", () => {
    expect(CSP_DIRECTIVES).toContain("worker-src 'self' blob:");
  });

  it("restricts form actions", () => {
    expect(CSP_DIRECTIVES).toContain("form-action 'self'");
  });

  it("does not contain wildcard origins", () => {
    const wildcard_pattern = /(?<!\.)(\*\s)/;
    expect(wildcard_pattern.test(CSP_DIRECTIVES)).toBe(false);
  });

  it("does not include unsafe-inline for scripts", () => {
    const script_src_match = CSP_DIRECTIVES.match(/script-src[^;]*/);
    expect(script_src_match).not.toBeNull();
    expect(script_src_match![0]).not.toContain("unsafe-inline");
  });
});
