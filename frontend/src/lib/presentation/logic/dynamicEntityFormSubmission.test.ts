import { beforeEach, describe, expect, it, vi } from "vitest";

import { DYNAMIC_ENTITY_FORM_MESSAGE } from "./dynamicEntityFormMessages";
import {
  resolve_dynamic_form_create_result,
  resolve_dynamic_form_update_result,
} from "./dynamicEntityFormSubmission";

const { get_use_cases_for_entity_type_mock } = vi.hoisted(() => ({
  get_use_cases_for_entity_type_mock: vi.fn(),
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

describe("dynamicEntityFormSubmission", () => {
  beforeEach(() => {
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("prefers injected CRUD handlers for create and update operations", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { id: "entity-1" } });
    const update = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { id: "entity-1" } });

    await expect(
      resolve_dynamic_form_create_result("team", { create } as never, {
        name: "Lions",
      }),
    ).resolves.toEqual({ success: true, data: { id: "entity-1" } });
    await expect(
      resolve_dynamic_form_update_result(
        "team",
        { update } as never,
        "entity-1",
        { name: "Lions" },
      ),
    ).resolves.toEqual({ success: true, data: { id: "entity-1" } });
  });

  it("falls back to entity use cases and reports unsupported create or update operations", async () => {
    get_use_cases_for_entity_type_mock
      .mockReturnValueOnce({ success: false })
      .mockReturnValueOnce({ success: true, data: {} })
      .mockReturnValueOnce({
        success: true,
        data: {
          create: vi
            .fn()
            .mockResolvedValue({ success: true, data: { id: "entity-2" } }),
        },
      })
      .mockReturnValueOnce({ success: true, data: {} });

    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: false,
      error: DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_HANDLER_MISSING,
    });
    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: false,
      error: DYNAMIC_ENTITY_FORM_MESSAGE.CREATE_NOT_SUPPORTED,
    });
    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: true,
      data: { id: "entity-2" },
    });
    await expect(
      resolve_dynamic_form_update_result("team", {}, "entity-2", {
        name: "Lions",
      }),
    ).resolves.toEqual({
      success: false,
      error: DYNAMIC_ENTITY_FORM_MESSAGE.UPDATE_NOT_SUPPORTED,
    });
  });
});
