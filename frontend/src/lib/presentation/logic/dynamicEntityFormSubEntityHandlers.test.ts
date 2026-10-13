import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_sub_entity_crud_handlers } from "./dynamicEntityFormInitialization";

const { get_use_cases_for_entity_type_mock, use_cases } = vi.hoisted(() => ({
  get_use_cases_for_entity_type_mock: vi.fn(),
  use_cases: {
    create: vi.fn(async () => ({ success: true, data: { id: "created" } })),
    update: vi.fn(async () => ({ success: true, data: { id: "updated" } })),
    delete: vi.fn(async () => ({ success: true, data: true })),
    list: vi.fn(async () => ({ success: true, data: { items: [] } })),
    get_by_id: vi.fn(),
  },
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

describe("create_sub_entity_crud_handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: use_cases,
    });
  });

  it("returns an empty handler set when the child use cases are missing", () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: false,
      error: "missing",
    });
    expect(
      create_sub_entity_crud_handlers("unknown", {
        foreign_key_field: "team_id",
        foreign_key_value: "team-1",
      }),
    ).toEqual({});
  });

  it("scopes create and list calls to the parent and holder type", async () => {
    const handlers = create_sub_entity_crud_handlers("jerseycolor", {
      foreign_key_field: "holder_id",
      foreign_key_value: "team-1",
      holder_type_field: "holder_type",
      holder_type_value: "team",
    });

    const create_result_1 = await handlers.create?.({
      name: "Red",
      holder_id: "other",
    });
    expect(create_result_1?.success).toBe(true);
    const list_result_2 = await handlers.list?.(
      { status: "active" },
      { page_number: 2 },
    );
    expect(list_result_2?.success).toBe(true);

    expect(use_cases.create).toHaveBeenCalledWith({
      name: "Red",
      holder_id: "team-1",
      holder_type: "team",
    });
    expect(use_cases.list).toHaveBeenCalledWith(
      { status: "active", holder_id: "team-1", holder_type: "team" },
      { page_number: 2 },
    );
    expect(Object.keys(handlers).sort()).toEqual([
      "create",
      "delete",
      "list",
      "update",
    ]);
  });

  it("omits holder scope when holder details are incomplete", async () => {
    const handlers = create_sub_entity_crud_handlers("teamstaff", {
      foreign_key_field: "team_id",
      foreign_key_value: "team-1",
      holder_type_field: "holder_type",
    });

    const create_result_3 = await handlers.create?.({ name: "Coach" });
    expect(create_result_3?.success).toBe(true);
    const list_result_4 = await handlers.list?.();
    expect(list_result_4?.success).toBe(true);
    const update_result_5 = await handlers.update?.("staff-1", {
      name: "Head Coach",
    });
    expect(update_result_5?.success).toBe(true);
    const delete_result_6 = await handlers.delete?.("staff-1");
    expect(delete_result_6?.success).toBe(true);

    expect(use_cases.create).toHaveBeenCalledWith({
      name: "Coach",
      team_id: "team-1",
    });
    expect(use_cases.list).toHaveBeenCalledWith({ team_id: "team-1" }, void 0);
    expect(use_cases.update).toHaveBeenCalledWith("staff-1", {
      name: "Head Coach",
    });
    expect(use_cases.delete).toHaveBeenCalledWith("staff-1");
  });
});
