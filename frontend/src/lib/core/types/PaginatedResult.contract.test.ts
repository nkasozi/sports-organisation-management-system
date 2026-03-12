import { describe, it, expect, vi } from "vitest";
import { create_organization_use_cases } from "../usecases/OrganizationUseCases";
import { create_competition_use_cases } from "../usecases/CompetitionUseCases";
import { create_team_use_cases } from "../usecases/TeamUseCases";
import { create_player_use_cases } from "../usecases/PlayerUseCases";
import { create_fixture_use_cases } from "../usecases/FixtureUseCases";
import type { PaginatedResult } from "./Result";

function make_paginated_result<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: 100,
    total_pages: 1,
  };
}

function make_paginated_success<T>(items: T[]) {
  return { success: true as const, data: make_paginated_result(items) };
}

describe("PaginatedResult contract", () => {
  describe("result shape from list()", () => {
    it("list() returns result.data.items — NOT a plain array at result.data", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([{ id: "1", name: "Org A" }])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(Array.isArray(result.data)).toBe(false);
      expect(result.data).toHaveProperty("items");
      expect(result.data).toHaveProperty("total_count");
      expect(result.data).toHaveProperty("page_number");
      expect(result.data).toHaveProperty("page_size");
      expect(result.data).toHaveProperty("total_pages");

      expect(Array.isArray(result.data.items)).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total_count).toBe(1);
    });

    it("result.data is NOT callable as an array — .filter/.map/.find exist on .items", async () => {
      const items = [{ id: "1" }, { id: "2" }];
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success(items)),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      if (!result.success) return;

      expect(typeof (result.data as any).filter).toBe("undefined");
      expect(typeof (result.data as any).map).toBe("undefined");
      expect(typeof (result.data as any).find).toBe("undefined");
      expect(typeof (result.data as any).slice).toBe("undefined");

      expect(typeof result.data.items.filter).toBe("function");
      expect(typeof result.data.items.map).toBe("function");
      expect(typeof result.data.items.find).toBe("function");
      expect(typeof result.data.items.slice).toBe("function");
    });

    it("competition list() returns paginated shape", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([{ id: "comp-1", name: "Cup" }])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;
      const stage_lifecycle = { replace_stages_for_competition: vi.fn() } as any;
      const { create_competition_use_cases_with_stage_lifecycle } = await import(
        "../usecases/CompetitionUseCases"
      );
      const use_cases = create_competition_use_cases_with_stage_lifecycle(repo, stage_lifecycle);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]).toHaveProperty("id", "comp-1");
      expect(result.data.total_count).toBe(1);
    });

    it("team list() returns paginated shape", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([{ id: "team-1", name: "Eagles" }])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;
      const use_cases = create_team_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total_count).toBe(1);
    });

    it("fixture list() returns paginated shape", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([{ id: "fix-1" }])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_by_ids: vi.fn(),
        find_by_status: vi.fn(),
        find_by_competition: vi.fn(),
        find_by_team: vi.fn(),
        find_by_organization: vi.fn(),
        create_many: vi.fn(),
        count: vi.fn(),
      } as any;
      const use_cases = create_fixture_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total_count).toBe(1);
    });

    it("total_count lives on result.data.total_count — NOT result.total_count", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([{ id: "p-1" }, { id: "p-2" }])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect((result as any).total_count).toBeUndefined();
      expect(result.data.total_count).toBe(2);
    });

    it("empty list() result has items:[] and total_count:0", async () => {
      const repo = {
        find_all: vi.fn().mockResolvedValue(make_paginated_success([])),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_active_organizations: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toEqual([]);
      expect(result.data.total_count).toBe(0);
      expect(result.data.items).toHaveLength(0);
    });
  });

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
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      const correct_consumer = (res: typeof result): string[] => {
        if (!res.success || !res.data) return [];
        return res.data.items.map((org) => org.name);
      };

      const broken_consumer = (res: typeof result): string[] => {
        if (!res.success) return [];
        return (res.data as any).map?.((org: any) => org.name) ?? [];
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
      } as any;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      if (!result.success) return;

      const total = result.data.total_count;
      const page_count = result.data.total_pages;
      const current_page_items = result.data.items;

      expect(total).toBe(47);
      expect(page_count).toBe(16);
      expect(current_page_items).toHaveLength(3);

      expect((result as any).total_count).toBeUndefined();
      expect((result as any).total_pages).toBeUndefined();
    });
  });
});
