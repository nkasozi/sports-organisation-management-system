import { describe, expect, it } from "vitest";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev",
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

  it("allows Google Fonts", () => {
    expect(CSP_DIRECTIVES).toContain("https://fonts.googleapis.com");
    expect(CSP_DIRECTIVES).toContain("https://fonts.gstatic.com");
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
});
