import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_competition_team_use_cases } from "../../core/usecases/CompetitionTeamUseCases";

export type CompetitionTeamsResult = {
  teams: BaseEntity[];
  all_competition_teams: BaseEntity[];
  competition_team_ids: Set<string>;
};

export type PlayerMembershipTeamsResult = {
  teams: BaseEntity[];
  auto_select_team_id?: string;
};

export type JerseyOptionsResult = {
  jerseys: BaseEntity[];
};

export type FilteredFetchResult = {
  entities: BaseEntity[];
  all_competition_teams?: BaseEntity[];
  competition_team_ids?: Set<string>;
  auto_select_team_id?: string;
};

export async function fetch_entities_for_type(
  entity_type: string,
  filter?: Record<string, string>,
  page_size: number = 1000,
): Promise<BaseEntity[]> {
  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (
    !use_cases_result.success ||
    typeof use_cases_result.data.list !== "function"
  ) {
    console.warn(
      `[DataLoader] No list method found for entity type: ${entity_type}`,
    );
    return [];
  }
  const use_cases = use_cases_result.data;
  const result = await use_cases.list(filter, { page_size });
  if (!result.success) {
    const error_msg =
      "error_message" in result
        ? (result as { error_message: string }).error_message
        : "error" in result
          ? (result as { error: string }).error
          : "Unknown error";
    console.warn(`[DataLoader] Failed to load ${entity_type}:`, error_msg);
    return [];
  }
  const data = result.data as unknown;
  if (Array.isArray(data)) return data as BaseEntity[];
  if (Array.isArray((data as { items?: unknown })?.items)) {
    return (data as { items: unknown[] }).items as unknown as BaseEntity[];
  }
  return [];
}

export async function fetch_unfiltered_foreign_key_options(
  fields: FieldMetadata[],
): Promise<Record<string, BaseEntity[]>> {
  const new_options: Record<string, BaseEntity[]> = {};
  for (const field of fields) {
    if (field.field_type !== "foreign_key" || !field.foreign_key_entity)
      continue;
    if (field.foreign_key_filter) continue;
    const entities = await fetch_entities_for_type(field.foreign_key_entity);
    console.debug("[DataLoader] Loaded FK options", {
      field: field.field_name,
      count: entities.length,
    });
    new_options[field.field_name] = entities;
  }
  return new_options;
}

export async function fetch_teams_from_competition(
  competition_id: string,
  form_data: Record<string, any>,
  exclude_field?: string,
): Promise<CompetitionTeamsResult> {
  const empty_result: CompetitionTeamsResult = {
    teams: [],
    all_competition_teams: [],
    competition_team_ids: new Set(),
  };

  const competition_team_use_cases = get_competition_team_use_cases();
  const comp_teams_result =
    await competition_team_use_cases.list_teams_in_competition(competition_id, {
      page_size: 100,
    });

  if (!comp_teams_result.success) {
    console.warn(
      "[DataLoader] Failed to load competition teams:",
      competition_id,
    );
    return empty_result;
  }

  const competition_teams = comp_teams_result.data.items;
  const competition_team_ids = new Set(
    competition_teams.map((ct: { team_id: any }) => ct.team_id),
  );

  const all_teams = await fetch_entities_for_type("team");
  if (all_teams.length === 0) {
    console.warn(
      "[DataLoader] Failed to load teams for competition:",
      competition_id,
    );
    return { ...empty_result, competition_team_ids };
  }

  const filtered_teams = all_teams.filter((team) =>
    competition_team_ids.has(team.id),
  );
  const exclude_value = exclude_field ? form_data[exclude_field] : null;
  const final_teams = exclude_value
    ? filtered_teams.filter((team) => team.id !== exclude_value)
    : filtered_teams;

  console.debug("[DataLoader] Loaded competition teams", {
    competition_id,
    total: competition_teams.length,
    filtered: final_teams.length,
    exclude_field,
    exclude_value,
  });

  return {
    teams: final_teams,
    all_competition_teams: filtered_teams,
    competition_team_ids,
  };
}

export async function fetch_entities_filtered_by_organization(
  entity_type: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  const all_entities = await fetch_entities_for_type(entity_type);
  return all_entities.filter(
    (entity) =>
      (entity as unknown as { organization_id?: string }).organization_id ===
      organization_id,
  );
}

export async function fetch_stages_from_competition(
  competition_id: string,
): Promise<BaseEntity[]> {
  return fetch_entities_for_type("competitionstage", { competition_id }, 100);
}

export async function fetch_officials_from_organization(
  organization_id: string,
): Promise<BaseEntity[]> {
  return fetch_entities_for_type("official", { organization_id });
}

export async function fetch_teams_from_player_memberships(
  player_id: string,
  field_current_value: string | undefined,
): Promise<PlayerMembershipTeamsResult> {
  const [memberships, all_teams] = await Promise.all([
    fetch_entities_for_type("playerteammembership", { player_id }),
    fetch_entities_for_type("team"),
  ]);

  const player_team_ids = new Set(
    memberships.map((m) => (m as unknown as { team_id: string }).team_id),
  );
  const membership_teams = all_teams.filter((team) =>
    player_team_ids.has(team.id),
  );

  console.debug("[DataLoader] Loaded player membership teams", {
    player_id,
    total_memberships: memberships.length,
    team_count: membership_teams.length,
  });

  const auto_select_team_id =
    membership_teams.length > 0 && !field_current_value
      ? membership_teams[0].id
      : undefined;

  return { teams: membership_teams, auto_select_team_id };
}

export async function fetch_teams_excluding_player_memberships(
  player_id: string,
  cached_players: BaseEntity[],
  organization_id: string | undefined,
): Promise<BaseEntity[]> {
  const [memberships, all_teams] = await Promise.all([
    fetch_entities_for_type("playerteammembership", { player_id }),
    fetch_entities_for_type("team"),
  ]);

  const player_team_ids = new Set(
    memberships.map((m) => (m as unknown as { team_id: string }).team_id),
  );

  const selected_player = cached_players.find((p) => p.id === player_id);
  const player_gender_id = (
    selected_player as unknown as { gender_id?: string }
  )?.gender_id;

  console.debug("[DataLoader] Resolved player gender from cache", {
    player_id,
    player_found: !!selected_player,
    player_gender_id,
  });

  const available_teams = all_teams.filter((team) => {
    const t = team as unknown as {
      organization_id?: string;
      gender_id?: string;
    };
    const is_in_org = !organization_id || t.organization_id === organization_id;
    const is_not_player_team = !player_team_ids.has(team.id);
    const is_matching_gender =
      !player_gender_id || !t.gender_id || t.gender_id === player_gender_id;
    return is_in_org && is_not_player_team && is_matching_gender;
  });

  console.debug("[DataLoader] Loaded teams excluding player memberships", {
    player_id,
    player_gender_id,
    total_memberships: memberships.length,
    total_teams: all_teams.length,
    available_count: available_teams.length,
  });

  return available_teams;
}

export async function fetch_filtered_jersey_options(
  field: FieldMetadata,
  fixture_id: string,
): Promise<JerseyOptionsResult> {
  const empty: JerseyOptionsResult = { jerseys: [] };
  const filter_config = field.foreign_key_filter;
  if (!filter_config) return empty;

  const fixture_use_cases_result = get_use_cases_for_entity_type("fixture");
  const jersey_use_cases_result = get_use_cases_for_entity_type("jerseycolor");

  if (!fixture_use_cases_result.success || !jersey_use_cases_result.success) {
    console.warn("[DataLoader] Missing use cases for filtered jersey options");
    return empty;
  }

  const fixture_use_cases = fixture_use_cases_result.data;
  const jersey_use_cases = jersey_use_cases_result.data;

  const fixture_result = await fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) {
    console.warn("[DataLoader] Could not load fixture:", fixture_id);
    return empty;
  }

  const fixture = fixture_result.data as any;
  let filter_holder_id = "";
  let filter_holder_type = "";

  if (filter_config.filter_type === "team_jersey_from_fixture") {
    filter_holder_type = "team";
    filter_holder_id =
      filter_config.team_side === "home"
        ? fixture.home_team_id
        : fixture.away_team_id;
  } else if (filter_config.filter_type === "official_jersey_from_competition") {
    filter_holder_type = "competition_official";
    filter_holder_id = fixture.competition_id;
  }

  if (!filter_holder_id) {
    console.warn("[DataLoader] No holder ID found for jersey filter");
    return empty;
  }

  const jersey_result = await jersey_use_cases.list({
    holder_type: filter_holder_type,
    holder_id: filter_holder_id,
  });

  if (!jersey_result.success) return empty;

  const data = jersey_result.data as unknown;
  const jerseys: BaseEntity[] = Array.isArray(data)
    ? (data as BaseEntity[])
    : Array.isArray((data as { items?: unknown })?.items)
      ? ((data as { items: unknown[] }).items as unknown as BaseEntity[])
      : [];

  console.debug("[DataLoader] Loaded filtered jersey options", {
    field: field.field_name,
    filter_type: filter_config.filter_type,
    holder_type: filter_holder_type,
    count: jerseys.length,
  });

  return { jerseys };
}

export async function fetch_filtered_entities_for_field(
  field: FieldMetadata,
  dependency_value: string,
  cached_players: BaseEntity[],
  form_data: Record<string, any>,
): Promise<FilteredFetchResult> {
  const filter_type = field.foreign_key_filter?.filter_type;
  const exclude_field = field.foreign_key_filter?.exclude_field;
  const organization_id = form_data["organization_id"] as string | undefined;

  if (filter_type === "teams_from_competition") {
    const result = await fetch_teams_from_competition(
      dependency_value,
      form_data,
      exclude_field,
    );
    return {
      entities: result.teams,
      all_competition_teams: result.all_competition_teams,
      competition_team_ids: result.competition_team_ids,
    };
  }

  if (filter_type === "competitions_from_organization") {
    return {
      entities: await fetch_entities_filtered_by_organization(
        "competition",
        dependency_value,
      ),
    };
  }

  if (filter_type === "stages_from_competition") {
    return { entities: await fetch_stages_from_competition(dependency_value) };
  }

  if (filter_type === "fixtures_from_organization") {
    return {
      entities: await fetch_entities_filtered_by_organization(
        "fixture",
        dependency_value,
      ),
    };
  }

  if (filter_type === "teams_from_organization") {
    return {
      entities: await fetch_entities_filtered_by_organization(
        "team",
        dependency_value,
      ),
    };
  }

  if (filter_type === "players_from_organization") {
    return {
      entities: await fetch_entities_filtered_by_organization(
        "player",
        dependency_value,
      ),
    };
  }

  if (filter_type === "teams_from_player_memberships") {
    const result = await fetch_teams_from_player_memberships(
      dependency_value,
      form_data[field.field_name],
    );
    return {
      entities: result.teams,
      auto_select_team_id: result.auto_select_team_id,
    };
  }

  if (filter_type === "teams_excluding_player_memberships") {
    return {
      entities: await fetch_teams_excluding_player_memberships(
        dependency_value,
        cached_players,
        organization_id,
      ),
    };
  }

  if (filter_type === "officials_from_organization") {
    return {
      entities: await fetch_officials_from_organization(dependency_value),
    };
  }

  if (filter_type === "lookup_from_organization") {
    const entity_type = field.foreign_key_entity!;
    return {
      entities: await fetch_entities_filtered_by_organization(
        entity_type,
        dependency_value,
      ),
    };
  }

  if (filter_type === "live_game_logs_from_organization") {
    return {
      entities: await fetch_entities_filtered_by_organization(
        "livegamelog",
        dependency_value,
      ),
    };
  }

  const jersey_result = await fetch_filtered_jersey_options(
    field,
    dependency_value,
  );
  return { entities: jersey_result.jerseys };
}

export function compute_teams_after_exclusion(
  all_competition_teams: BaseEntity[],
  exclude_value: string | null,
): BaseEntity[] {
  if (!exclude_value) return [...all_competition_teams];
  return all_competition_teams.filter((team) => team.id !== exclude_value);
}

export async function fetch_venue_name_for_team(
  team_id: string,
  all_competition_teams: BaseEntity[],
): Promise<string | null> {
  const selected_team = all_competition_teams.find(
    (team) => team.id === team_id,
  ) as { home_venue_id?: string } | undefined;

  if (!selected_team?.home_venue_id) return null;

  const venue_use_cases_result = get_use_cases_for_entity_type("venue");
  if (!venue_use_cases_result.success) {
    console.warn("[DataLoader] Missing venue use cases");
    return null;
  }
  const venue_use_cases = venue_use_cases_result.data;

  const venue_result = await venue_use_cases.get_by_id(
    selected_team.home_venue_id,
  );
  if (!venue_result.success || !venue_result.data) {
    console.warn(
      "[DataLoader] Failed to load venue:",
      selected_team.home_venue_id,
    );
    return null;
  }

  const venue_name = (venue_result.data as { name?: string }).name ?? null;
  console.debug("[DataLoader] Resolved home venue name:", venue_name);
  return venue_name;
}
