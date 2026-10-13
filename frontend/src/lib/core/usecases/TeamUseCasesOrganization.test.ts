import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import { create_team_use_cases } from "./TeamUseCases";
import {
  create_mock_repository,
  create_mock_team,
  create_paginated_result,
} from "./TeamUseCases.test_support";

describe("TeamUseCases", () => {
  let mock_repository: TeamRepository;
  let use_cases: ReturnType<typeof create_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_use_cases(mock_repository);
  });

  describe("list_teams_by_organization", () => {
    it("returns teams for an organization", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1" }),
        create_mock_team({ id: "t2" }),
      ];
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list_teams_by_organization("org_1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
      }
      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org_1",
        {},
      );
    });

    it("returns error when organization id is empty", async () => {
      const result = await use_cases.list_teams_by_organization("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
      expect(mock_repository.find_by_organization).not.toHaveBeenCalled();
    });

    it("returns error when organization id is whitespace only", async () => {
      const result = await use_cases.list_teams_by_organization("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization ID is required");
    });

    it("passes query options to repository", async () => {
      const options = { page_number: 1, page_size: 50 } as QueryOptions;
      vi.mocked(mock_repository.find_by_organization).mockResolvedValue(
        create_paginated_result([]),
      );

      const result = await use_cases.list_teams_by_organization(
        "org_1",
        options,
      );

      expect(result.success).toBe(true);

      expect(mock_repository.find_by_organization).toHaveBeenCalledWith(
        "org_1",
        options,
      );
    });
  });
});
