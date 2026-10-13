import type { Mock } from "vitest";

export type AutoSetupDependenciesMock = {
  competition_use_cases: { get_by_id: Mock };
  get_current_role: Mock;
  can_access_route: Mock;
  update_checks: Mock;
  set_is_starting: Mock;
  goto: Mock;
  restart: Mock;
  fixture_details_setup_use_cases: never;
  jersey_color_use_cases: never;
  official_use_cases: never;
  game_official_role_use_cases: never;
};
