import {
  get_competition_repository,
  InBrowserCompetitionRepository,
} from "../repositories/InBrowserCompetitionRepository";
import {
  get_competition_stage_repository,
  InBrowserCompetitionStageRepository,
} from "../repositories/InBrowserCompetitionStageRepository";
import {
  get_competition_team_repository,
  InBrowserCompetitionTeamRepository,
} from "../repositories/InBrowserCompetitionTeamRepository";
import {
  get_fixture_lineup_repository,
  InBrowserFixtureLineupRepository,
} from "../repositories/InBrowserFixtureLineupRepository";
import {
  get_fixture_repository,
  InBrowserFixtureRepository,
} from "../repositories/InBrowserFixtureRepository";
import {
  get_jersey_color_repository,
  InBrowserJerseyColorRepository,
} from "../repositories/InBrowserJerseyColorRepository";
import {
  get_official_repository,
  InBrowserOfficialRepository,
} from "../repositories/InBrowserOfficialRepository";
import {
  get_player_profile_repository,
  InBrowserPlayerProfileRepository,
} from "../repositories/InBrowserPlayerProfileRepository";
import {
  get_player_repository,
  InBrowserPlayerRepository,
} from "../repositories/InBrowserPlayerRepository";
import {
  get_player_team_membership_repository,
  InBrowserPlayerTeamMembershipRepository,
} from "../repositories/InBrowserPlayerTeamMembershipRepository";
import {
  get_profile_link_repository,
  InBrowserProfileLinkRepository,
} from "../repositories/InBrowserProfileLinkRepository";
import {
  get_team_profile_repository,
  InBrowserTeamProfileRepository,
} from "../repositories/InBrowserTeamProfileRepository";
import {
  get_team_repository,
  InBrowserTeamRepository,
} from "../repositories/InBrowserTeamRepository";
import {
  get_team_staff_repository,
  InBrowserTeamStaffRepository,
} from "../repositories/InBrowserTeamStaffRepository";
import {
  get_venue_repository,
  InBrowserVenueRepository,
} from "../repositories/InBrowserVenueRepository";

export interface DemoSeedingRepos {
  player: InBrowserPlayerRepository;
  venue: InBrowserVenueRepository;
  team: InBrowserTeamRepository;
  team_staff: InBrowserTeamStaffRepository;
  official: InBrowserOfficialRepository;
  competition: InBrowserCompetitionRepository;
  competition_stage: InBrowserCompetitionStageRepository;
  competition_team: InBrowserCompetitionTeamRepository;
  player_membership: InBrowserPlayerTeamMembershipRepository;
  fixture: InBrowserFixtureRepository;
  fixture_lineup: InBrowserFixtureLineupRepository;
  jersey_color: InBrowserJerseyColorRepository;
  player_profile: InBrowserPlayerProfileRepository;
  team_profile: InBrowserTeamProfileRepository;
  profile_link: InBrowserProfileLinkRepository;
}

export function build_demo_seeding_repos(): DemoSeedingRepos {
  return {
    player: get_player_repository() as InBrowserPlayerRepository,
    venue: get_venue_repository() as InBrowserVenueRepository,
    team: get_team_repository() as InBrowserTeamRepository,
    team_staff: get_team_staff_repository() as InBrowserTeamStaffRepository,
    official: get_official_repository() as InBrowserOfficialRepository,
    competition: get_competition_repository() as InBrowserCompetitionRepository,
    competition_stage:
      get_competition_stage_repository() as InBrowserCompetitionStageRepository,
    competition_team:
      get_competition_team_repository() as InBrowserCompetitionTeamRepository,
    player_membership:
      get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository,
    fixture: get_fixture_repository() as InBrowserFixtureRepository,
    fixture_lineup:
      get_fixture_lineup_repository() as InBrowserFixtureLineupRepository,
    jersey_color:
      get_jersey_color_repository() as InBrowserJerseyColorRepository,
    player_profile:
      get_player_profile_repository() as InBrowserPlayerProfileRepository,
    team_profile:
      get_team_profile_repository() as InBrowserTeamProfileRepository,
    profile_link:
      get_profile_link_repository() as InBrowserProfileLinkRepository,
  };
}
