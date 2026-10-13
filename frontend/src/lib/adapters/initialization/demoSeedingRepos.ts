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
  bind_repository_to_origin,
  type RepositoryWriteOrigin,
  type WriteOriginBindable as InBrowserOriginBindable,
} from "../repositories/InBrowserRepositoryWriteOrigin";
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

type RepositoryBinder = <
  TRepository extends InBrowserOriginBindable<TRepository>,
>(
  repository: TRepository,
) => TRepository;

type PeopleAndPlaceRepos = Pick<
  DemoSeedingRepos,
  "player" | "venue" | "team" | "team_staff" | "official" | "jersey_color"
>;

function build_people_and_place_repos(
  bind: RepositoryBinder,
): PeopleAndPlaceRepos {
  return {
    player: bind(get_player_repository() as InBrowserPlayerRepository),
    venue: bind(get_venue_repository() as InBrowserVenueRepository),
    team: bind(get_team_repository() as InBrowserTeamRepository),
    team_staff: bind(
      get_team_staff_repository() as InBrowserTeamStaffRepository,
    ),
    official: bind(get_official_repository() as InBrowserOfficialRepository),
    jersey_color: bind(
      get_jersey_color_repository() as InBrowserJerseyColorRepository,
    ),
  };
}

function build_competition_and_profile_repos(
  bind: RepositoryBinder,
): Omit<DemoSeedingRepos, keyof PeopleAndPlaceRepos> {
  return {
    competition: bind(
      get_competition_repository() as InBrowserCompetitionRepository,
    ),
    competition_stage: bind(
      get_competition_stage_repository() as InBrowserCompetitionStageRepository,
    ),
    competition_team: bind(
      get_competition_team_repository() as InBrowserCompetitionTeamRepository,
    ),
    player_membership: bind(
      get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository,
    ),
    fixture: bind(get_fixture_repository() as InBrowserFixtureRepository),
    fixture_lineup: bind(
      get_fixture_lineup_repository() as InBrowserFixtureLineupRepository,
    ),
    player_profile: bind(
      get_player_profile_repository() as InBrowserPlayerProfileRepository,
    ),
    team_profile: bind(
      get_team_profile_repository() as InBrowserTeamProfileRepository,
    ),
    profile_link: bind(
      get_profile_link_repository() as InBrowserProfileLinkRepository,
    ),
  };
}

export function build_demo_seeding_repos(
  origin: RepositoryWriteOrigin,
): DemoSeedingRepos {
  const bind: RepositoryBinder = (repository) =>
    bind_repository_to_origin(repository, origin);
  return {
    ...build_people_and_place_repos(bind),
    ...build_competition_and_profile_repos(bind),
  };
}
