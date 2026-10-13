import { describe, expect, it, vi } from "vitest";

import { create_organization_use_cases } from "../usecases/OrganizationUseCases";
import { make_paginated_success } from "./PaginatedResult.contract.test_support";

describe("PaginatedResult contract", () => {
  describe("correct consumer patterns", () => {
    it("consumer correctly extracts items from list() result", async () => {
      const org_items = [{ id: "org-1", name: "Hawks FC" }];
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success(org_items)),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as never;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      const correct_consumer = (res: typeof result): string[] => {
        if (!res.success || !res.data) return [];
        return res.data.items.map((org) => org.name);
      };

      const broken_consumer = (res: typeof result): string[] => {
        if (!res.success) return [];
        const array_like = res.data as unknown as {
          map?: (mapper: (org: { name: string }) => string) => string[];
        };
        return array_like.map?.((org) => org.name) ?? [];
      };

      expect(correct_consumer(result)).toEqual(["Hawks FC"]);
      expect(broken_consumer(result)).toEqual([]);
    });

    it("consumer correctly reads total_count for pagination UI", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: [{ id: "1" }, { id: "2" }, { id: "3" }],
            total_count: 47,
            page_number: 1,
            page_size: 3,
            total_pages: 16,
          },
        }),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as never;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      if (!result.success) return;

      const total = result.data.total_count;
      const page_count = result.data.total_pages;
      const current_page_items = result.data.items;

      expect(total).toBe(47);
      expect(page_count).toBe(16);
      expect(current_page_items).toHaveLength(3);

      expect(
        (result as unknown as Record<string, unknown>).total_count,
      ).toBeUndefined();
      expect(
        (result as unknown as Record<string, unknown>).total_pages,
      ).toBeUndefined();
    });
  });
});
