import { describe, expect, it, vi } from "vitest";

const sentinels = vi.hoisted(() => {
  const player_team_transfer_history_repository = {
    name: "player_team_transfer_history_repository",
  };

  return {
    activity_category_repository: { name: "activity_category_repository" },
    activity_repository: { name: "activity_repository" },
    audit_log_repository: { name: "audit_log_repository" },
    calendar_token_repository: { name: "calendar_token_repository" },
    competition_format_repository: { name: "competition_format_repository" },
    competition_repository: { name: "competition_repository" },
    competition_stage_repository: { name: "competition_stage_repository" },
    competition_team_repository: { name: "competition_team_repository" },
    fixture_details_setup_repository: {
      name: "fixture_details_setup_repository",
    },
    fixture_lineup_repository: { name: "fixture_lineup_repository" },
    fixture_repository: { name: "fixture_repository" },
    game_event_log_repository: { name: "game_event_log_repository" },
    game_event_type_repository: { name: "game_event_type_repository" },
    game_official_role_repository: { name: "game_official_role_repository" },
    gender_repository: { name: "gender_repository" },
    identification_repository: { name: "identification_repository" },
    identification_type_repository: {
      name: "identification_type_repository",
    },
    jersey_color_repository: { name: "jersey_color_repository" },
    live_game_log_repository: { name: "live_game_log_repository" },
    official_associated_team_repository: {
      name: "official_associated_team_repository",
    },
    official_performance_rating_repository: {
      name: "official_performance_rating_repository",
    },
    official_repository: { name: "official_repository" },
    organization_repository: { name: "organization_repository" },
    organization_settings_repository: {
      name: "organization_settings_repository",
    },
    player_position_repository: { name: "player_position_repository" },
    player_profile_repository: { name: "player_profile_repository" },
    player_repository: { name: "player_repository" },
    player_team_membership_repository: {
      name: "player_team_membership_repository",
    },
    player_team_transfer_history_repository,
    player_team_transfer_history_repository_constructor: vi.fn(
      function MockPlayerTeamTransferHistoryRepository() {
        return player_team_transfer_history_repository;
      },
    ),
    profile_link_repository: { name: "profile_link_repository" },
    qualification_repository: { name: "qualification_repository" },
    sport_repository: { name: "sport_repository" },
    system_user_repository: { name: "system_user_repository" },
    team_profile_repository: { name: "team_profile_repository" },
    team_repository: { name: "team_repository" },
    team_staff_repository: { name: "team_staff_repository" },
    team_staff_role_repository: { name: "team_staff_role_repository" },
    venue_repository: { name: "venue_repository" },
  };
});

vi.mock("../adapters/repositories/InBrowserActivityCategoryRepository", () => ({
  get_activity_category_repository: vi.fn(
    () => sentinels.activity_category_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserActivityRepository", () => ({
  get_activity_repository: vi.fn(() => sentinels.activity_repository),
}));
vi.mock("../adapters/repositories/InBrowserAuditLogRepository", () => ({
  get_audit_log_repository: vi.fn(() => sentinels.audit_log_repository),
}));
vi.mock("../adapters/repositories/InBrowserCalendarTokenRepository", () => ({
  get_calendar_token_repository: vi.fn(
    () => sentinels.calendar_token_repository,
  ),
}));
vi.mock(
  "../adapters/repositories/InBrowserCompetitionFormatRepository",
  () => ({
    get_competition_format_repository: vi.fn(
      () => sentinels.competition_format_repository,
    ),
  }),
);
vi.mock("../adapters/repositories/InBrowserCompetitionRepository", () => ({
  get_competition_repository: vi.fn(() => sentinels.competition_repository),
}));
vi.mock("../adapters/repositories/InBrowserCompetitionStageRepository", () => ({
  get_competition_stage_repository: vi.fn(
    () => sentinels.competition_stage_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserCompetitionTeamRepository", () => ({
  get_competition_team_repository: vi.fn(
    () => sentinels.competition_team_repository,
  ),
}));
vi.mock(
  "../adapters/repositories/InBrowserFixtureDetailsSetupRepository",
  () => ({
    get_fixture_details_setup_repository: vi.fn(
      () => sentinels.fixture_details_setup_repository,
    ),
  }),
);
vi.mock("../adapters/repositories/InBrowserFixtureLineupRepository", () => ({
  get_fixture_lineup_repository: vi.fn(
    () => sentinels.fixture_lineup_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserFixtureRepository", () => ({
  get_fixture_repository: vi.fn(() => sentinels.fixture_repository),
}));
vi.mock("../adapters/repositories/InBrowserGameEventLogRepository", () => ({
  get_game_event_log_repository: vi.fn(
    () => sentinels.game_event_log_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserGameEventTypeRepository", () => ({
  get_game_event_type_repository: vi.fn(
    () => sentinels.game_event_type_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserGameOfficialRoleRepository", () => ({
  get_game_official_role_repository: vi.fn(
    () => sentinels.game_official_role_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserGenderRepository", () => ({
  get_gender_repository: vi.fn(() => sentinels.gender_repository),
}));
vi.mock("../adapters/repositories/InBrowserIdentificationRepository", () => ({
  get_identification_repository: vi.fn(
    () => sentinels.identification_repository,
  ),
}));
vi.mock(
  "../adapters/repositories/InBrowserIdentificationTypeRepository",
  () => ({
    get_identification_type_repository: vi.fn(
      () => sentinels.identification_type_repository,
    ),
  }),
);
vi.mock("../adapters/repositories/InBrowserJerseyColorRepository", () => ({
  get_jersey_color_repository: vi.fn(() => sentinels.jersey_color_repository),
}));
vi.mock("../adapters/repositories/InBrowserLiveGameLogRepository", () => ({
  get_live_game_log_repository: vi.fn(() => sentinels.live_game_log_repository),
}));
vi.mock(
  "../adapters/repositories/InBrowserOfficialAssociatedTeamRepository",
  () => ({
    get_official_associated_team_repository: vi.fn(
      () => sentinels.official_associated_team_repository,
    ),
  }),
);
vi.mock(
  "../adapters/repositories/InBrowserOfficialPerformanceRatingRepository",
  () => ({
    get_official_performance_rating_repository: vi.fn(
      () => sentinels.official_performance_rating_repository,
    ),
  }),
);
vi.mock("../adapters/repositories/InBrowserOfficialRepository", () => ({
  get_official_repository: vi.fn(() => sentinels.official_repository),
}));
vi.mock("../adapters/repositories/InBrowserOrganizationRepository", () => ({
  get_organization_repository: vi.fn(() => sentinels.organization_repository),
}));
vi.mock(
  "../adapters/repositories/InBrowserOrganizationSettingsRepository",
  () => ({
    get_organization_settings_repository: vi.fn(
      () => sentinels.organization_settings_repository,
    ),
  }),
);
vi.mock("../adapters/repositories/InBrowserPlayerPositionRepository", () => ({
  get_player_position_repository: vi.fn(
    () => sentinels.player_position_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserPlayerProfileRepository", () => ({
  get_player_profile_repository: vi.fn(
    () => sentinels.player_profile_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserPlayerRepository", () => ({
  get_player_repository: vi.fn(() => sentinels.player_repository),
}));
vi.mock(
  "../adapters/repositories/InBrowserPlayerTeamMembershipRepository",
  () => ({
    get_player_team_membership_repository: vi.fn(
      () => sentinels.player_team_membership_repository,
    ),
  }),
);
vi.mock(
  "../adapters/repositories/InBrowserPlayerTeamTransferHistoryRepository",
  () => ({
    InBrowserPlayerTeamTransferHistoryRepository:
      sentinels.player_team_transfer_history_repository_constructor,
  }),
);
vi.mock("../adapters/repositories/InBrowserProfileLinkRepository", () => ({
  get_profile_link_repository: vi.fn(() => sentinels.profile_link_repository),
}));
vi.mock("../adapters/repositories/InBrowserQualificationRepository", () => ({
  get_qualification_repository: vi.fn(() => sentinels.qualification_repository),
}));
vi.mock("../adapters/repositories/InBrowserSportRepository", () => ({
  get_sport_repository: vi.fn(() => sentinels.sport_repository),
}));
vi.mock("../adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: vi.fn(() => sentinels.system_user_repository),
}));
vi.mock("../adapters/repositories/InBrowserTeamProfileRepository", () => ({
  get_team_profile_repository: vi.fn(() => sentinels.team_profile_repository),
}));
vi.mock("../adapters/repositories/InBrowserTeamRepository", () => ({
  get_team_repository: vi.fn(() => sentinels.team_repository),
}));
vi.mock("../adapters/repositories/InBrowserTeamStaffRepository", () => ({
  get_team_staff_repository: vi.fn(() => sentinels.team_staff_repository),
}));
vi.mock("../adapters/repositories/InBrowserTeamStaffRoleRepository", () => ({
  get_team_staff_role_repository: vi.fn(
    () => sentinels.team_staff_role_repository,
  ),
}));
vi.mock("../adapters/repositories/InBrowserVenueRepository", () => ({
  get_venue_repository: vi.fn(() => sentinels.venue_repository),
}));

import { create_in_browser_repository_container } from "./RepositoryContainerFactory";

describe("RepositoryContainerFactory", () => {
  it("builds the in-browser repository container from all registered repositories", () => {
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
