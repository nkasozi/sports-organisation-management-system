import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { is_copy_success_for_token } from "./calendarSubscriptionManagerState";

describe("is_copy_success_for_token", () => {
  it("matches only the most recently copied token", () => {
    expect(is_copy_success_for_token(create_some_option("a"), "a")).toBe(true);
    expect(is_copy_success_for_token(create_some_option("a"), "b")).toBe(false);
  });

  it("is false when nothing was copied", () => {
    expect(is_copy_success_for_token(create_none_option(), "a")).toBe(false);
  });
});
