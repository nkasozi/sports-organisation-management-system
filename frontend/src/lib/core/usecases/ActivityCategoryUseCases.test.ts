import { describe, expect, it, vi } from "vitest";

import { create_activity_category_use_cases } from "./ActivityCategoryUseCases";
import {
  make_category,
  make_create_input,
  make_mock_repository,
} from "./ActivityCategoryUseCases.test_support";

describe("list", () => {
  it("delegates to repository.find_all with the given filter", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.list({ organization_id: "org-1" });

    expect(result.success).toBe(true);

    expect(repo.find_all).toHaveBeenCalledWith(
      { organization_id: "org-1" },
      {},
    );
  });
});

describe("get_by_id", () => {
  it("returns failure when id is empty string", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.get_by_id("");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();
  });

  it("returns failure when id is whitespace only", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

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

    const result = await use_cases.get_by_id("cat-1");

    expect(result.success).toBe(true);

    expect(repo.find_by_id).toHaveBeenCalledWith("cat-1");
  });
});

describe("create", () => {
  it("returns failure when name is missing", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.create(make_create_input({ name: "" }));

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();
  });

  it("returns failure when organization_id is missing", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.create(
      make_create_input({ organization_id: "" }),
    );

    expect(result.success).toBe(false);
  });

  it("returns failure when color is missing", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.create(make_create_input({ color: "" }));

    expect(result.success).toBe(false);
  });

  it("returns failure when category_type is missing", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.create(
      make_create_input({ category_type: "" as "custom" }),
    );

    expect(result.success).toBe(false);
  });

  it("returns failure when name exceeds 100 characters", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

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

    const result = await use_cases.create(make_create_input());

    expect(result.success).toBe(true);

    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe("update", () => {
  it("returns failure when id is empty", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.update("", { name: "Renamed" });

    expect(result.success).toBe(false);
  });

  it("delegates to repository.update when id is valid", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.update("cat-1", { name: "Renamed" });

    expect(result.success).toBe(true);

    expect(repo.update).toHaveBeenCalledWith("cat-1", { name: "Renamed" });
  });
});
