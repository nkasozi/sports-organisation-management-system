import { describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  load_verified_identity,
  parse_verified_identity_record,
  save_verified_identity,
} from "./authOfflineVerifiedIdentity";

const stored_settings: Record<string, string> = {};

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: async (key: string) => stored_settings[key] ?? "",
    set_setting: async (key: string, value: string) => {
      stored_settings[key] = value;
    },
  }),
}));

describe("verified identity record", () => {
  it("round-trips the verified account", async () => {
    await save_verified_identity({
      clerk_user_id: "user_1",
      email: "ann@example.com",
    });

    await expect(load_verified_identity()).resolves.toEqual(
      create_some_option({ clerk_user_id: "user_1", email: "ann@example.com" }),
    );
  });

  it("rejects malformed records", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parse_verified_identity_record("")).toEqual(create_none_option());
    expect(parse_verified_identity_record("{nope")).toEqual(
      create_none_option(),
    );
    expect(
      parse_verified_identity_record(JSON.stringify({ clerk_user_id: "u" })),
    ).toEqual(create_none_option());
  });
});
