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
const DEFAULT_ORGANIZATION_NAME = "Organization";

export interface OfficialLeaderboardViewState {
  leaderboard_entries: OfficialLeaderboardEntry[];
  selected_entry: OfficialLeaderboardEntry | null;
  selected_breakdown: PerFixtureRating[];
}

export interface OfficialLeaderboardRebuildCommand {
  all_ratings: OfficialPerformanceRating[];
  all_officials: Official[];
  all_fixtures: Fixture[];
  all_stages: CompetitionStage[];
  selected_organization_id: string;
  user_official_id: string | null;
}

export interface OfficialLeaderboardSelectionCommand {
  all_ratings: OfficialPerformanceRating[];
  all_fixtures: Fixture[];
  selected_organization_id: string;
  entry: OfficialLeaderboardEntry;
}

export function can_user_change_official_leaderboard_organizations(
  profile: UserScopeProfile | null,
): boolean {
  if (!profile) return false;
  return profile.organization_id === ANY_VALUE || !profile.organization_id;
}

export function get_selected_official_leaderboard_organization_name(
  organizations: Organization[],
  selected_organization_id: string,
): string {
  return (
    organizations.find(
      (organization) => organization.id === selected_organization_id,
    )?.name ?? DEFAULT_ORGANIZATION_NAME
  );
}

export function resolve_official_leaderboard_organizations(
  organizations: Organization[],
  profile: UserScopeProfile | null,
): Organization[] {
  const organization_scope = get_scope_value(profile, "organization_id");
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
    event: "official_leaderboard_entry_selected",
    official_id: command.entry.official_id,
    rating_count: selected_breakdown.length,
  });

  return {
    selected_entry: command.entry,
    selected_breakdown,
  };
}

export function rebuild_official_leaderboard_view(
  command: OfficialLeaderboardRebuildCommand,
): OfficialLeaderboardViewState {
  const organization_filtered_ratings = filter_ratings_by_organization(
    command.all_ratings,
    command.selected_organization_id,
  );
  const filtered_ratings = command.user_official_id
    ? filter_ratings_by_official(
        organization_filtered_ratings,
        command.user_official_id,
      )
    : organization_filtered_ratings;
  const official_name_map = build_official_name_map(command.all_officials);
  const leaderboard_entries = build_leaderboard_entries(
    filtered_ratings,
    command.all_fixtures,
    command.all_stages,
    official_name_map,
  );

  console.info("[OfficialLeaderboard] Entries rebuilt", {
    event: "official_leaderboard_rebuilt",
    entry_count: leaderboard_entries.length,
    organization_id: command.selected_organization_id,
  });

  if (!command.user_official_id || leaderboard_entries.length === 0) {
    return {
      leaderboard_entries,
      selected_entry: null,
      selected_breakdown: [],
    };
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
