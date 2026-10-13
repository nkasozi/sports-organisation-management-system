import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_entity,
  delete_entities_by_ids,
  delete_existing_entity,
  find_all_entities,
  find_entities_by_ids,
  find_entity_by_id,
  write_updated_entity,
} from "./InBrowserBaseRepositoryOperations";
import {
  FAKE_TABLE_FAILURE_MESSAGE,
  FAKE_TABLE_MODE,
  type FakeTable,
  get_fake_table,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { row } from "./InBrowserRepositoryFilterCases.test_support";

const RAW_FAILURE = `Error: ${FAKE_TABLE_FAILURE_MESSAGE}`;

function as_table(table: FakeTable): never {
  return table as never;
}

describe("InBrowserBaseRepositoryOperations outcomes", () => {
  let warn_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reset_fake_database();
    warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn_spy.mockRestore();
  });

  it("creates, reads, updates and deletes entities", async () => {
    const table = as_table(seed_fake_table("items", [row("i1", { n: 1 })]));

    const created = await create_entity(
      table,
      { n: 2 },
      "item",
      (input, id, stamps) => ({ id, ...stamps, ...input }) as never,
    );
    const existing = await find_entity_by_id(table, "i1");
    const updated = await write_updated_entity(
      table,
      existing.success ? existing.data : (row("i1", {}) as never),
      { n: 5 },
      (entity, updates) => ({ ...(entity as object), ...updates }) as never,
    );
    const by_ids = await find_entities_by_ids(table, ["i1", "zz"]);
    const deleted = await delete_existing_entity(table, "i1");
    const bulk_deleted = await delete_entities_by_ids(table, ["a", "b"]);

    expect(created.success && String(created.data.id).startsWith("item")).toBe(
      true,
    );
    expect(
      updated.success && (updated.data as unknown as { n: number }).n,
    ).toBe(5);
    expect(by_ids.success && by_ids.data.map((item) => item.id)).toEqual([
      "i1",
    ]);
    expect(deleted).toEqual({ success: true, data: true });
    expect(bulk_deleted).toEqual({ success: true, data: 2 });
  });

  it("reports missing entities on read", async () => {
    const table = as_table(get_fake_table("items"));
    const not_found = { success: false, error: "Entity with id 'x' not found" };

    expect(await find_entity_by_id(table, "x")).toEqual(not_found);
  });

  it("reports storage failures with operation names and warnings", async () => {
    const table_state = get_fake_table("items");
    table_state.mode = FAKE_TABLE_MODE.FAILING;
    const table = as_table(table_state);
    const failure = (operation: string): { success: false; error: string } => ({
      success: false,
      error: `Failed to ${operation}`,
    });

    expect(await find_all_entities(table, {}, (items) => items)).toEqual(
      failure("fetch entities"),
    );
    expect(await find_entity_by_id(table, "x")).toEqual(
      failure("fetch entity by id"),
    );
    expect(await find_entities_by_ids(table, ["x"])).toEqual(
      failure("fetch entities by ids"),
    );
    expect(await create_entity(table, {}, "item", () => ({}) as never)).toEqual(
      failure("create entity"),
    );
    expect(await delete_entities_by_ids(table, ["x"])).toEqual(
      failure("delete entities"),
    );
    expect(warn_spy).toHaveBeenCalledWith(
      "[Repository] Failed to fetch entity by id",
      {
        event: "repository_fetch_entity_by_id_failed",
        error_code: "repository_storage_operation_failed",
        operation: "fetch entity by id",
        table: "items",
        entity_id: "x",
        error: RAW_FAILURE,
      },
    );
  });

  it("reports write failures after a successful lookup", async () => {
    const table_state = seed_fake_table("items", [row("i1", {})]);
    const table = as_table(table_state);
    table_state.put = () =>
      Promise.reject(new Error(FAKE_TABLE_FAILURE_MESSAGE));
    table_state.delete = () =>
      Promise.reject(new Error(FAKE_TABLE_FAILURE_MESSAGE));

    const existing = row("i1", {}) as never;
    expect(
      await write_updated_entity(table, existing, {}, (entity) => entity),
    ).toEqual({
      success: false,
      error: "Failed to update entity",
    });
    expect(await delete_existing_entity(table, "i1")).toEqual({
      success: false,
      error: "Failed to delete entity",
    });
    expect(warn_spy).toHaveBeenCalledWith(
      "[Repository] Failed to delete entity",
      {
        event: "repository_delete_entity_failed",
        error_code: "repository_storage_operation_failed",
        operation: "delete entity",
        table: "items",
        entity_id: "i1",
        error: RAW_FAILURE,
      },
    );
  });
});
