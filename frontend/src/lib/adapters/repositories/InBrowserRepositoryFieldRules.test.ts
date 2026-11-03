import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_entity,
  write_updated_entity,
} from "./InBrowserBaseRepositoryEntityWrites";
import {
  type FakeTable,
  get_fake_table,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { row } from "./InBrowserRepositoryFilterCases.test_support";

function as_table(table: FakeTable): never {
  return table as never;
}

function build_from_input(input: object, id: string, stamps: object): never {
  return { id, ...stamps, ...input } as never;
}

describe("saving through a repository checks filled-in fields", () => {
  beforeEach(() => {
    reset_fake_database();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("refuses a user's new record with a bad value and stores nothing", async () => {
    const table_state = get_fake_table("players");

    const result = await create_entity(
      as_table(table_state),
      { first_name: "Grace", phone: "12" },
      "player",
      build_from_input,
      true,
    );

    expect(result.success).toBe(false);
    expect(result.success ? "" : result.error).toMatch(
      /^Please check your entries: Phone should be a phone number/,
    );
    expect(table_state.rows).toHaveLength(0);
  });

  it("refuses a user's change that puts a value out of range", async () => {
    const table_state = seed_fake_table("players", [row("p1", {})]);

    const result = await write_updated_entity(
      as_table(table_state),
      row("p1", {}) as never,
      { height_cm: 900 },
      (entity, updates) => ({ ...(entity as object), ...updates }) as never,
      true,
    );

    expect(result.success ? "" : result.error).toMatch(
      /Height \(cm\) must be between 30 and 300/,
    );
  });

  it("saves empty optional fields and leaves system writes unchecked", async () => {
    const table = as_table(get_fake_table("players"));

    const with_blanks = await create_entity(
      table,
      { first_name: "Grace", phone: "", height_cm: "" },
      "player",
      build_from_input,
      true,
    );
    const system_write = await create_entity(
      table,
      { phone: "12" },
      "player",
      build_from_input,
      false,
    );

    expect(with_blanks.success).toBe(true);
    expect(system_write.success).toBe(true);
  });
});
