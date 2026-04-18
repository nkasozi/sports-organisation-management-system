import { describe, expect, it, vi } from "vitest";

import {
  find_activity_category_by_type,
  upsert_synced_activity,
} from "./ActivitySyncUseCasesHelpers";

describe("ActivitySyncUseCasesHelpers", () => {
  it("finds an activity category by type and reports missing categories", async () => {
    await expect(
      find_activity_category_by_type(
        {
          find_by_category_type: vi.fn().mockResolvedValue({
            success: true,
            data: { items: [{ id: "category_1" }] },
          }),
        } as never,
        "org_1",
        "fixture",
      ),
    ).resolves.toEqual({ success: true, data: "category_1" });

    await expect(
      find_activity_category_by_type(
        {
          find_by_category_type: vi.fn().mockResolvedValue({
            success: true,
            data: { items: [] },
          }),
        } as never,
        "org_1",
        "fixture",
      ),
    ).resolves.toEqual({
      success: false,
      error: "No fixture category found for organization: org_1",
    });
  });

  it("updates existing activities and creates missing activities", async () => {
    await expect(
      upsert_synced_activity(
        {
          update: vi.fn().mockResolvedValue({ success: true, data: true }),
          create: vi.fn(),
        } as never,
        { status: "existing", activity: { id: "activity_1" } as never },
        {} as never,
        { title: "Updated" } as never,
      ),
    ).resolves.toEqual({ success: true, data: true });

    await expect(
      upsert_synced_activity(
        {
          update: vi.fn(),
          create: vi
            .fn()
            .mockResolvedValue({ success: true, data: { id: "activity_2" } }),
        } as never,
        { status: "missing" },
        { title: "Created" } as never,
        {} as never,
      ),
    ).resolves.toEqual({ success: true, data: false });
  });
});
