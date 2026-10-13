import { describe, expect, it, vi } from "vitest";

import type { ActivityCategory } from "../entities/ActivityCategory";
import { create_activity_category_use_cases } from "./ActivityCategoryUseCases";
import {
  make_category,
  make_mock_repository,
} from "./ActivityCategoryUseCases.test_support";

describe("ensure_default_categories_exist", () => {
  it("returns failure when organization_id is empty", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.ensure_default_categories_exist("");

    expect(result.success).toBe(false);
  });

  it("returns failure when find_by_organization fails", async () => {
    const repo = make_mock_repository();
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "DB error",
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(false);
  });

  it("creates all default categories when none exist yet", async () => {
    const repo = make_mock_repository();
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { items: [], total: 0 },
    });
    (repo.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category(),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data?.categories_created).toBeGreaterThan(0);
  });

  it("skips categories that already exist as system-generated", async () => {
    const repo = make_mock_repository();
    const existing_categories = [
      make_category({
        category_type: "competition",
        is_system_generated: true,
      }),
      make_category({
        id: "cat-2",
        category_type: "fixture",
        is_system_generated: true,
      }),
    ] as ActivityCategory[];
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { items: existing_categories, total: 2 },
    });
    (repo.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category(),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(true);
    const expected_missing_count = 8 - 2;
    if (!result.success) return;
    expect(result.data?.categories_created).toBe(expected_missing_count);
  });

  it("does not create categories that already exist", async () => {
    const all_default_types = [
      "competition",
      "fixture",
      "training",
      "administrative",
      "transfer_window",
      "meeting",
      "medical",
      "travel",
    ] as const;
    const repo = make_mock_repository();
    const all_existing: ActivityCategory[] = all_default_types.map(
      (type, index) =>
        make_category({
          id: `cat-${index}`,
          category_type: type,
          is_system_generated: true,
        }),
    );
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { items: all_existing, total: all_existing.length },
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data?.categories_created).toBe(0);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("counts only successfully created categories", async () => {
    const repo = make_mock_repository();
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { items: [], total: 0 },
    });
    (repo.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ success: true, data: make_category() })
      .mockResolvedValue({ success: false, error: "DB write failed" });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data?.categories_created).toBe(1);
  });

  it("does not count user-created (non-system) categories as already existing", async () => {
    const repo = make_mock_repository();
    const user_created = [
      make_category({
        category_type: "competition",
        is_system_generated: false,
      }),
    ] as ActivityCategory[];
    (repo.find_by_organization as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { items: user_created, total: 1 },
    });
    (repo.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category(),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.ensure_default_categories_exist("org-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data?.categories_created).toBe(8);
  });
});
