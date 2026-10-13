import { describe, expect, it } from "vitest";

import {
  filter_links_with_safe_urls,
  to_safe_css_url,
  to_safe_image_source,
  to_safe_link_url,
} from "./safeUrl";

describe("to_safe_link_url", () => {
  it.each([
    "https://example.test/profile",
    "http://example.test",
    " https://example.test ",
  ])("accepts http and https url %j", (raw_url: string) => {
    expect(to_safe_link_url(raw_url)).toEqual({
      status: "some",
      value: raw_url.trim(),
    });
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "blob:https://example.test/abc",
    "/relative/path",
    "//evil.test",
    "",
    "not a url",
  ])("rejects unsafe or non http link %j", (raw_url: string) => {
    expect(to_safe_link_url(raw_url)).toEqual({ status: "none" });
  });

  it("rejects non string values", () => {
    expect(to_safe_link_url(undefined as unknown as string)).toEqual({
      status: "none",
    });
  });
});

describe("to_safe_image_source", () => {
  it.each([
    "https://cdn.example.test/logo.png",
    "http://cdn.example.test/logo.png",
    "data:image/png;base64,iVBORw0KGgo=",
    "blob:https://app.example.test/0b6f",
    "/images/default-team-logo.svg",
  ])("accepts safe image source %j", (raw_source: string) => {
    expect(to_safe_image_source(raw_source)).toEqual({
      status: "some",
      value: raw_source,
    });
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "//evil.test/x.png",
    "",
    "blob:",
  ])("rejects unsafe image source %j", (raw_source: string) => {
    expect(to_safe_image_source(raw_source)).toEqual({ status: "none" });
  });
});

describe("filter_links_with_safe_urls", () => {
  it("keeps only links whose url is http or https", () => {
    const links = [
      { id: "1", url: "https://example.test" },
      { id: "2", url: "javascript:alert(1)" },
      { id: "3", url: "http://other.test" },
    ];

    expect(filter_links_with_safe_urls(links)).toEqual([
      { id: "1", url: "https://example.test" },
      { id: "3", url: "http://other.test" },
    ]);
  });
});

describe("to_safe_css_url", () => {
  it("wraps a safe image source in a quoted css url", () => {
    expect(to_safe_css_url("/african-mosaic-bg.svg")).toEqual({
      status: "some",
      value: 'url("/african-mosaic-bg.svg")',
    });
  });

  it("percent-encodes characters that could break out of the css url", () => {
    expect(to_safe_css_url("https://cdn.example.test/a\"b\\c'd)e.png")).toEqual(
      {
        status: "some",
        value: 'url("https://cdn.example.test/a%22b%5Cc%27d%29e.png")',
      },
    );
  });

  it("rejects unsafe sources", () => {
    expect(to_safe_css_url("javascript:alert(1)")).toEqual({
      status: "none",
    });
  });
});
