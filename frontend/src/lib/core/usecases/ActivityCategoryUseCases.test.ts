import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_activity_category_use_cases } from "./ActivityCategoryUseCases";
import type {
  ActivityCategory,
  CreateActivityCategoryInput,
} from "../entities/ActivityCategory";
import type { ActivityCategoryRepository } from "../interfaces/ports";

function make_mock_repository(): ActivityCategoryRepository {
  return {
    find_all: vi.fn().mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
    find_by_id: vi.fn().mockResolvedValue({ success: true, data: null }),
    create: vi.fn().mockResolvedValue({ success: true, data: null }),
    update: vi.fn().mockResolvedValue({ success: true, data: null }),
    delete_by_id: vi.fn().mockResolvedValue({ success: true, data: true }),
    find_by_organization: vi.fn().mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
  } as unknown as ActivityCategoryRepository;
}

function make_category(overrides: Partial<ActivityCategory> = {}): ActivityCategory {
  return {
    id: "cat-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    name: "Competition",
    description: "Default competition category",
    organization_id: "org-1",
    category_type: "competition",
    color: "#3B82F6",
    icon: "trophy",
    is_system_generated: false,
    ...overrides,
  };
}

function make_create_input(overrides: Partial<CreateActivityCategoryInput> = {}): CreateActivityCategoryInput {
  return {
    name: "Custom Events",
    description: "Custom event category",
    organization_id: "org-1",
    category_type: "custom",
    color: "#8B5CF6",
    icon: "star",
    is_system_generated: false,
    ...overrides,
  };
}

describe("list", () => {
  it("delegates to repository.find_all with the given filter", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.list({ organization_id: "org-1" });

    expect(repo.find_all).toHaveBeenCalledWith({ organization_id: "org-1" }, undefined);
  });
});

describe("get_by_id", () => {
  it("returns failure when id is empty string", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.get_by_id("");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns failure when id is whitespace only", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.get_by_id("   ");

    expect(result.success).toBe(false);
  });

  it("delegates to repository.find_by_id with the given id", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category(),
    });
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.get_by_id("cat-1");

    expect(repo.find_by_id).toHaveBeenCalledWith("cat-1");
  });
});

describe("create", () => {
  it("returns failure when name is missing", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.create(make_create_input({ name: "" }));

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns failure when organization_id is missing", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.create(
      make_create_input({ organization_id: "" }),
    );

    expect(result.success).toBe(false);
  });

  it("returns failure when color is missing", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.create(make_create_input({ color: "" }));

    expect(result.success).toBe(false);
  });

  it("returns failure when category_type is missing", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.create(
      make_create_input({ category_type: "" as "custom" }),
    );

    expect(result.success).toBe(false);
  });

  it("returns failure when name exceeds 100 characters", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.create(
      make_create_input({ name: "a".repeat(101) }),
    );

    expect(result.success).toBe(false);
  });

  it("calls repository.create when input is valid", async () => {
    const repo = make_mock_repository();
    const created = make_category();
    (repo.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: created,
    });
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.create(make_create_input());

    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe("update", () => {
  it("returns failure when id is empty", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.update("", { name: "Renamed" });

    expect(result.success).toBe(false);
  });

  it("delegates to repository.update when id is valid", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.update("cat-1", { name: "Renamed" });

    expect(repo.update).toHaveBeenCalledWith("cat-1", { name: "Renamed" });
  });
});

describe("delete", () => {
  it("returns failure when id is empty", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.delete("");

    expect(result.success).toBe(false);
  });

  it("returns failure when category is system-generated", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category({ is_system_generated: true }),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.delete("cat-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("system-generated");
  });

  it("does not call repository.delete_by_id when category is system-generated", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category({ is_system_generated: true }),
    });
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.delete("cat-1");

    expect(repo.delete_by_id).not.toHaveBeenCalled();
  });

  it("calls repository.delete_by_id when category is not system-generated", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category({ is_system_generated: false }),
    });
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.delete("cat-1");

    expect(repo.delete_by_id).toHaveBeenCalledWith("cat-1");
  });

  it("returns failure when find_by_id fails", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "Not found",
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.delete("cat-missing");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
  });
});

describe("list_by_organization", () => {
  it("returns failure when organization_id is empty", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.list_by_organization("");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns failure when organization_id is whitespace only", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

    const result = await use_cases.list_by_organization("   ");

    expect(result.success).toBe(false);
  });

  it("delegates to repository.find_by_organization", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    await use_cases.list_by_organization("org-1");

    expect(repo.find_by_organization).toHaveBeenCalledWith("org-1", undefined);
  });
});

describe("ensure_default_categories_exist", () => {
  it("returns failure when organization_id is empty", async () => {
    const use_cases = create_activity_category_use_cases(make_mock_repository());

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
    expect(result.data?.categories_created).toBeGreaterThan(0);
  });

  it("skips categories that already exist as system-generated", async () => {
    const repo = make_mock_repository();
    const existing_categories: ActivityCategory[] = [
      make_category({
        category_type: "competition",
        is_system_generated: true,
      }),
      make_category({
        id: "cat-2",
        category_type: "fixture",
        is_system_generated: true,
      }),
    ];
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
    expect(result.data?.categories_created).toBe(1);
  });

  it("does not count user-created (non-system) categories as already existing", async () => {
    const repo = make_mock_repository();
    const user_created: ActivityCategory[] = [
      make_category({
        category_type: "competition",
        is_system_generated: false,
      }),
    ];
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
    expect(result.data?.categories_created).toBe(8);
  });
});
