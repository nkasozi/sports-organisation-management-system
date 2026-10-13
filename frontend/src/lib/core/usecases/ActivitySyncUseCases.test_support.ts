import { type Mock, vi } from "vitest";

import type { ActivityUseCasesPort } from "../interfaces/ports";
import { create_activity_sync } from "./ActivitySyncUseCases";

interface SyncTestRepositories {
  activity: { create: Mock; update: Mock; find_by_source: Mock };
  category: { find_by_category_type: Mock };
  competition: { find_by_organization: Mock };
  fixture: { find_by_competition: Mock; find_all: Mock };
  team: { find_by_id: Mock };
}

interface PagedTestResult {
  success: true;
  data: { items: unknown[] };
}

type ActivitySyncTestMethods = Pick<
  ActivityUseCasesPort,
  | "sync_competitions_to_activities"
  | "sync_fixtures_to_activities"
  | "find_activity_by_source"
>;

export function create_repositories(): SyncTestRepositories {
  return {
    activity: {
      create: vi.fn().mockResolvedValue({ success: true, data: {} }),
      update: vi.fn().mockResolvedValue({ success: true, data: {} }),
      find_by_source: vi.fn(),
    },
    category: {
      find_by_category_type: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ id: "cat1" }] },
      }),
    },
    competition: { find_by_organization: vi.fn() },
    fixture: { find_by_competition: vi.fn(), find_all: vi.fn() },
    team: {
      find_by_id: vi.fn((id: string) =>
        Promise.resolve(
          id === "t1"
            ? { success: true, data: { name: "Lions" } }
            : { success: false, error: "missing" },
        ),
      ),
    },
  };
}

export function create_sync(
  repositories: SyncTestRepositories,
): ActivitySyncTestMethods {
  return create_activity_sync({
    activity_repository: repositories.activity as never,
    activity_category_repository: repositories.category as never,
    competition_repository: repositories.competition as never,
    fixture_repository: repositories.fixture as never,
    team_repository: repositories.team as never,
  });
}

export function page(items: unknown[]): PagedTestResult {
  return { success: true, data: { items } };
}

export const FIXTURE = {
  id: "f1",
  home_team_id: "t1",
  away_team_id: "t2",
  scheduled_date: "2024-05-01",
  scheduled_time: "",
  competition_id: "c1",
  venue: "Field",
};
