import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { access_denial_store } from "./accessDenial";

describe("accessDenial", () => {
  beforeEach(() => {
    access_denial_store.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    access_denial_store.clear();
  });

  it("records the denied route, message, and timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    access_denial_store.set_denial("/admin", "Access denied");

    expect(get(access_denial_store)).toEqual({
      denied: true,
      route: "/admin",
      message: "Access denied",
      timestamp: 1700000000000,
    });
  });

  it("returns the current denial and clears the store", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000100);
    access_denial_store.set_denial("/secure", "Missing permission");

    expect(access_denial_store.get_and_clear()).toEqual({
      denied: true,
      route: "/secure",
      message: "Missing permission",
      timestamp: 1700000000100,
    });
    expect(get(access_denial_store)).toEqual({
      denied: false,
      route: "",
      message: "",
      timestamp: 0,
    });
  });
});
