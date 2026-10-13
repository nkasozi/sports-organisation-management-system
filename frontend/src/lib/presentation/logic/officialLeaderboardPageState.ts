import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Organization } from "$lib/core/entities/Organization";
import {
  ANY_VALUE,
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

import { OFFICIAL_EVENT, OFFICIAL_MESSAGE } from "./officialEventConstants";
import {
  build_fixture_label_map,
  build_leaderboard_entries,
  build_official_name_map,
  build_per_fixture_breakdown,
  filter_ratings_by_official,
  filter_ratings_by_organization,
  type OfficialLeaderboardEntry,
  type PerFixtureRating,
} from "./officialLeaderboardLogic";
import { PRESENCE_STATUS } from "./presenceStatus";

export type OfficialLeaderboardProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserScopeProfile };

export interface OfficialLeaderboardViewState {
  leaderboard_entries: OfficialLeaderboardEntry[];
  selected_entry?: OfficialLeaderboardEntry;
  selected_breakdown: PerFixtureRating[];
}

interface OfficialLeaderboardRebuildCommand {
  all_ratings: OfficialPerformanceRating[];
  all_officials: Official[];
  all_fixtures: Fixture[];
  all_stages: CompetitionStage[];
  selected_organization_id: string;
  user_official_id: string;
}

interface OfficialLeaderboardSelectionCommand {
  all_ratings: OfficialPerformanceRating[];
  all_fixtures: Fixture[];
  selected_organization_id: string;
  entry: OfficialLeaderboardEntry;
}

export function can_user_change_official_leaderboard_organizations(
  profile_state: OfficialLeaderboardProfileState,
): boolean {
  if (profile_state.status === PRESENCE_STATUS.MISSING) return false;
  return (
    profile_state.profile.organization_id === ANY_VALUE ||
    !profile_state.profile.organization_id
  );
}

export function get_selected_official_leaderboard_organization_name(
  organizations: Organization[],
  selected_organization_id: string,
): string {
  return (
    organizations.find(
      (organization) => organization.id === selected_organization_id,
    )?.name ?? OFFICIAL_MESSAGE.DEFAULT_ORGANIZATION_NAME
  );
}

export function resolve_official_leaderboard_organizations(
  organizations: Organization[],
  profile_state: OfficialLeaderboardProfileState,
): Organization[] {
  const organization_scope =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? get_scope_value(profile_state.profile, "organization_id")
      : void 0;
  if (!organization_scope) return organizations;
  return organizations.filter(
    (organization) => organization.id === organization_scope,
  );
}

export function select_official_leaderboard_entry(
  command: OfficialLeaderboardSelectionCommand,
): Pick<OfficialLeaderboardViewState, "selected_entry" | "selected_breakdown"> {
  const organization_filtered_ratings = filter_ratings_by_organization(
    command.all_ratings,
    command.selected_organization_id,
  );
  const official_ratings = filter_ratings_by_official(
    organization_filtered_ratings,
    command.entry.official_id,
  );
  const fixture_label_map = build_fixture_label_map(command.all_fixtures);
  const selected_breakdown = build_per_fixture_breakdown(
    official_ratings,
    fixture_label_map,
    command.all_fixtures,
  );

  console.info("[OfficialLeaderboard] Official selected", {
    event: OFFICIAL_EVENT.LEADERBOARD_ENTRY_SELECTED,
    official_id: command.entry.official_id,
    rating_count: selected_breakdown.length,
  });

  return {
    selected_entry: command.entry,
    selected_breakdown,
  };
}

function filter_ratings_for_leaderboard_view(
  command: OfficialLeaderboardRebuildCommand,
): OfficialPerformanceRating[] {
  const organization_filtered_ratings = filter_ratings_by_organization(
    command.all_ratings,
    command.selected_organization_id,
  );
  return command.user_official_id
    ? filter_ratings_by_official(
        organization_filtered_ratings,
        command.user_official_id,
      )
    : organization_filtered_ratings;
}

export function rebuild_official_leaderboard_view(
  command: OfficialLeaderboardRebuildCommand,
): OfficialLeaderboardViewState {
  const filtered_ratings = filter_ratings_for_leaderboard_view(command);
  const official_name_map = build_official_name_map(command.all_officials);
  const leaderboard_entries = build_leaderboard_entries(
    filtered_ratings,
    command.all_fixtures,
    command.all_stages,
    official_name_map,
  );

  console.info("[OfficialLeaderboard] Entries rebuilt", {
    event: OFFICIAL_EVENT.LEADERBOARD_REBUILT,
    entry_count: leaderboard_entries.length,
    organization_id: command.selected_organization_id,
  });

  if (!command.user_official_id || leaderboard_entries.length === 0) {
    return {
      leaderboard_entries,
      selected_entry: void 0,
      selected_breakdown: [],
    } as OfficialLeaderboardViewState;
  }

  return {
    leaderboard_entries,
    ...select_official_leaderboard_entry({
      all_ratings: command.all_ratings,
      all_fixtures: command.all_fixtures,
      selected_organization_id: command.selected_organization_id,
      entry: leaderboard_entries[0],
    }),
  };
}
