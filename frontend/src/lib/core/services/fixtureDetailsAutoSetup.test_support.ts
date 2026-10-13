import { vi } from "vitest";

import type { Fixture } from "../entities/Fixture";
import type { PaginatedResult, Result } from "../types/Result";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { GameOfficialRoleUseCases } from "../usecases/GameOfficialRoleUseCases";
import type { JerseyColorUseCases } from "../usecases/JerseyColorUseCases";
import type { OfficialUseCases } from "../usecases/OfficialUseCases";
import type { AutoSetupDependencies } from "./fixtureDetailsAutoSetup";

export function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture-1",
    organization_id: "org-1",
    home_team_id: "home-1",
    away_team_id: "away-1",
    competition_id: "comp-1",
    ...overrides,
  } as Fixture;
}

function create_single_item_page_result(
  id: string,
): Result<PaginatedResult<{ id: string }>> {
  return {
    success: true,
    data: {
      items: [{ id }],
      total_count: 1,
      page_number: 1,
      page_size: 100,
      total_pages: 1,
    },
  };
}

export function create_auto_setup_dependencies(): AutoSetupDependencies {
  return {
    fixture_details_setup_use_cases: {
      create: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "details-1" } }),
    } as Partial<FixtureDetailsSetupUseCases> as FixtureDetailsSetupUseCases,
    jersey_color_use_cases: {
      list_jerseys_by_entity: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ id: "jersey-1" }] },
      }),
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [{ id: "jersey-2" }] },
      }),
    } as Partial<JerseyColorUseCases> as JerseyColorUseCases,
    official_use_cases: {
      list: vi
        .fn()
        .mockResolvedValue(create_single_item_page_result("official-1")),
    } as Partial<OfficialUseCases> as OfficialUseCases,
    game_official_role_use_cases: {
      list: vi.fn().mockResolvedValue(create_single_item_page_result("role-1")),
    } as Partial<GameOfficialRoleUseCases> as GameOfficialRoleUseCases,
  };
}

export function log_jersey_mock_calls(
  dependencies: AutoSetupDependencies,
): boolean {
  console.log(
    "list_jerseys_by_entity calls:",
    vi.mocked(dependencies.jersey_color_use_cases.list_jerseys_by_entity).mock
      .calls,
  );
  console.log(
    "list calls:",
    vi.mocked(dependencies.jersey_color_use_cases.list).mock.calls,
  );
  return true;
}
