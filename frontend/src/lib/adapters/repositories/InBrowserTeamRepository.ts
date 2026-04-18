import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../core/entities/Team";
import { DEFAULT_TEAM_LOGO } from "../../core/entities/Team";
import type {
  QueryOptions,
  TeamFilter,
  TeamRepository,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_teams } from "./InBrowserTeamRepositoryDefaults";

const ENTITY_PREFIX = "team";

export class InBrowserTeamRepository
  extends InBrowserBaseRepository<
    Team,
    CreateTeamInput,
    UpdateTeamInput,
    TeamFilter
  >
  implements TeamRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Team, string> {
    return this.database.teams;
  }

  protected create_entity_from_input(
    input: CreateTeamInput,
    id: Team["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Team {
    return {
      id,
      ...timestamps,
      name: input.name,
      short_name: input.short_name,
      description: input.description,
      organization_id: input.organization_id,
      gender_id: input.gender_id || "",
      captain_player_id: input.captain_player_id,
      vice_captain_player_id: input.vice_captain_player_id,
      max_squad_size: input.max_squad_size,
      home_venue_id: input.home_venue_id,
      primary_color: input.primary_color,
      secondary_color: input.secondary_color,
      logo_url: input.logo_url || DEFAULT_TEAM_LOGO,
      website: input.website,
      founded_year: input.founded_year,
      status: input.status,
    } as Team;
  }

  protected apply_updates_to_entity(
    entity: Team,
    updates: UpdateTeamInput,
  ): Team {
    return {
      ...entity,
      ...updates,
    } as Team;
  }

  protected apply_entity_filter(entities: Team[], filter: TeamFilter): Team[] {
    let filtered_entities = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((team) =>
        team.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (team) => team.organization_id === filter.organization_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (team) => team.status === filter.status,
      );
    }

    return filtered_entities;
  }

  async find_by_organization(
    organization_id: Team["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team> {
    return this.find_all({ organization_id }, options);
  }

  async find_active_teams(options?: QueryOptions): PaginatedAsyncResult<Team> {
    return this.find_all({ status: "active" }, options);
  }
}

type TeamRepositoryState =
  | { status: "uninitialized" }
  | { status: "ready"; repository: InBrowserTeamRepository };

let team_repository_state: TeamRepositoryState = {
  status: "uninitialized",
};

export function get_team_repository(): TeamRepository {
  if (team_repository_state.status === "ready") {
    return team_repository_state.repository;
  }

  const repository = new InBrowserTeamRepository();

  team_repository_state = { status: "ready", repository };

  return repository;
}

export async function reset_team_repository(): Promise<void> {
  const repository = get_team_repository() as InBrowserTeamRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_teams());
}
