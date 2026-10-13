import { beforeEach, describe, expect, it } from "vitest";

import {
  build_role_user_context_fields,
  build_user_context_fields,
  clear_user_context,
  create_event_timestamp,
  set_user_context,
} from "./EventBusUserContext";

const CONTEXT = {
  user_id: "u1",
  user_email: "u1@example.com",
  user_display_name: "User One",
  organization_id: "org1",
} as never;

describe("EventBusUserContext", () => {
  beforeEach(() => {
    clear_user_context();
  });

  it("omits user context when none is set", () => {
    expect(build_user_context_fields()).toEqual({});
    expect(build_role_user_context_fields("player" as never)).toEqual({});
  });

  it("includes the current user context once set", () => {
    set_user_context(CONTEXT);

    expect(build_user_context_fields()).toEqual({ user_context: CONTEXT });
    expect(build_role_user_context_fields("player" as never)).toEqual({
      user_context: { ...(CONTEXT as object), role: "player" },
    });
  });

  it("clears context when set to undefined or cleared", () => {
    set_user_context(CONTEXT);
    set_user_context(undefined);
    expect(build_user_context_fields()).toEqual({});

    set_user_context(CONTEXT);
    clear_user_context();
    expect(build_user_context_fields()).toEqual({});
  });

  it("creates ISO timestamps", () => {
    expect(create_event_timestamp()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});
