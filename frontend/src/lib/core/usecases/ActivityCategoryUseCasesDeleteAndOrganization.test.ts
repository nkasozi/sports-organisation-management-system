import { describe, expect, it, vi } from "vitest";

import { create_activity_category_use_cases } from "./ActivityCategoryUseCases";
import {
  make_category,
  make_mock_repository,
} from "./ActivityCategoryUseCases.test_support";

describe("delete", () => {
  it("returns failure when id is empty", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

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
    if (result.success) return;
    expect(result.error).toContain("system-generated");
  });

  it("does not call repository.delete_by_id when category is system-generated", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category({ is_system_generated: true }),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.delete("cat-1");

    expect(result.success).toBe(false);
    expect(repo.delete_by_id).not.toHaveBeenCalled();
  });

  it("calls repository.delete_by_id when category is not system-generated", async () => {
    const repo = make_mock_repository();
    (repo.find_by_id as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: make_category({ is_system_generated: false }),
    });
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.delete("cat-1");

    expect(result.success).toBe(true);
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
    if (result.success) return;
    expect(result.error).toBe("Not found");
  });
});

describe("list_by_organization", () => {
  it("returns failure when organization_id is empty", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.list_by_organization("");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();
  });

  it("returns failure when organization_id is whitespace only", async () => {
    const use_cases = create_activity_category_use_cases(
      make_mock_repository(),
    );

    const result = await use_cases.list_by_organization("   ");

    expect(result.success).toBe(false);
  });

  it("delegates to repository.find_by_organization", async () => {
    const repo = make_mock_repository();
    const use_cases = create_activity_category_use_cases(repo);

    const result = await use_cases.list_by_organization("org-1");

    expect(result.success).toBe(true);

    expect(repo.find_by_organization).toHaveBeenCalledWith("org-1", {});
  });
});
