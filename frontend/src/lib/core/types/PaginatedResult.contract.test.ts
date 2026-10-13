import { describe, expect, it, vi } from "vitest";

import { create_organization_use_cases } from "../usecases/OrganizationUseCases";
import { make_paginated_success } from "./PaginatedResult.contract.test_support";

describe("PaginatedResult contract", () => {
  describe("result shape from list()", () => {
    it("list() returns result.data.items — NOT a plain array at result.data", async () => {
      const repo = {
        find_all: vi
          .fn()
          .mockResolvedValue(
            make_paginated_success([{ id: "1", name: "Org A" }]),
          ),
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
      } as never;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      if (!result.success) return;

      expect(
        typeof (result.data as unknown as Record<string, unknown>).filter,
      ).toBe("undefined");
      expect(
        typeof (result.data as unknown as Record<string, unknown>).map,
      ).toBe("undefined");
      expect(
        typeof (result.data as unknown as Record<string, unknown>).find,
      ).toBe("undefined");
      expect(
        typeof (result.data as unknown as Record<string, unknown>).slice,
      ).toBe("undefined");

      expect(typeof result.data.items.filter).toBe("function");
      expect(typeof result.data.items.map).toBe("function");
      expect(typeof result.data.items.find).toBe("function");
      expect(typeof result.data.items.slice).toBe("function");
    });

    it("total_count lives on result.data.total_count — NOT result.total_count", async () => {
      const repo = {
        find_all: vi
          .fn()
          .mockResolvedValue(
            make_paginated_success([{ id: "p-1" }, { id: "p-2" }]),
          ),
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

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(
        (result as unknown as Record<string, unknown>).total_count,
      ).toBeUndefined();
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
      } as never;

      const use_cases = create_organization_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toEqual([]);
      expect(result.data.total_count).toBe(0);
      expect(result.data.items).toHaveLength(0);
    });
  });
});
