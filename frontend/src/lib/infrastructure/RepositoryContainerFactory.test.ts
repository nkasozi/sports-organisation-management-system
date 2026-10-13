import { beforeAll, describe, expect, it } from "vitest";

import {
  register_repository_module_mocks,
  sentinels,
} from "./RepositoryContainerFactory.test_support";

describe("RepositoryContainerFactory", () => {
  beforeAll(() => {
    register_repository_module_mocks();
  });

  it("builds the in-browser repository container from all registered repositories", async () => {
    const { create_in_browser_repository_container } =
      await import("./RepositoryContainerFactory");

    expect(create_in_browser_repository_container()).toMatchObject({
      organization_repository: sentinels.organization_repository,
      competition_repository: sentinels.competition_repository,
      team_repository: sentinels.team_repository,
      player_repository: sentinels.player_repository,
      official_repository: sentinels.official_repository,
      fixture_repository: sentinels.fixture_repository,
      activity_repository: sentinels.activity_repository,
      activity_category_repository: sentinels.activity_category_repository,
      calendar_token_repository: sentinels.calendar_token_repository,
      system_user_repository: sentinels.system_user_repository,
      audit_log_repository: sentinels.audit_log_repository,
      sport_repository: sentinels.sport_repository,
      venue_repository: sentinels.venue_repository,
      gender_repository: sentinels.gender_repository,
      competition_format_repository: sentinels.competition_format_repository,
      competition_team_repository: sentinels.competition_team_repository,
      fixture_lineup_repository: sentinels.fixture_lineup_repository,
      fixture_details_setup_repository:
        sentinels.fixture_details_setup_repository,
      game_event_type_repository: sentinels.game_event_type_repository,
      game_official_role_repository: sentinels.game_official_role_repository,
      identification_type_repository: sentinels.identification_type_repository,
      identification_repository: sentinels.identification_repository,
      player_position_repository: sentinels.player_position_repository,
      player_team_membership_repository:
        sentinels.player_team_membership_repository,
      qualification_repository: sentinels.qualification_repository,
      team_staff_role_repository: sentinels.team_staff_role_repository,
      team_staff_repository: sentinels.team_staff_repository,
      player_profile_repository: sentinels.player_profile_repository,
      team_profile_repository: sentinels.team_profile_repository,
      profile_link_repository: sentinels.profile_link_repository,
      official_associated_team_repository:
        sentinels.official_associated_team_repository,
      official_performance_rating_repository:
        sentinels.official_performance_rating_repository,
      jersey_color_repository: sentinels.jersey_color_repository,
      live_game_log_repository: sentinels.live_game_log_repository,
      game_event_log_repository: sentinels.game_event_log_repository,
      competition_stage_repository: sentinels.competition_stage_repository,
      organization_settings_repository:
        sentinels.organization_settings_repository,
    });
  });
});
