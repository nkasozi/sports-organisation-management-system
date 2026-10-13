import { describe, expect, it, vi } from "vitest";

import { create_fixture_use_cases } from "../usecases/FixtureUseCases";
import { create_team_use_cases } from "../usecases/TeamUseCases";
import { make_paginated_success } from "./PaginatedResult.contract.test_support";

describe("PaginatedResult contract", () => {
  describe("result shape from list()", () => {
    it("competition list() returns paginated shape", async () => {
      const repo = {
        find_all: vi
          .fn()
          .mockResolvedValue(
            make_paginated_success([{ id: "comp-1", name: "Cup" }]),
          ),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as never;
      const stage_lifecycle = {
        replace_stages_for_competition: vi.fn(),
      } as never;
      const { create_competition_use_cases_with_stage_lifecycle } =
        await import("../usecases/CompetitionUseCases");
      const use_cases = create_competition_use_cases_with_stage_lifecycle(
        repo,
        stage_lifecycle,
      );
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]).toHaveProperty("id", "comp-1");
      expect(result.data.total_count).toBe(1);
    });

    it("team list() returns paginated shape", async () => {
      const repo = {
        find_all: vi
          .fn()
          .mockResolvedValue(
            make_paginated_success([{ id: "team-1", name: "Eagles" }]),
          ),
        find_by_id: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete_by_id: vi.fn(),
        delete_by_ids: vi.fn(),
        find_by_ids: vi.fn(),
        count: vi.fn(),
      } as never;
      const use_cases = create_team_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total_count).toBe(1);
    });

    it("fixture list() returns paginated shape", async () => {
      const repo = {
        find_all: vi
          .fn()
          .mockResolvedValue(make_paginated_success([{ id: "fix-1" }])),
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
      } as never;
      const use_cases = create_fixture_use_cases(repo);
      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total_count).toBe(1);
    });
  });
});
