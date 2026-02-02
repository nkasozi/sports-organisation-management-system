import type { Table } from "dexie";
import type {
  Team,
  CreateTeamInput,
  UpdateTeamInput,
} from "../../core/entities/Team";
import { DEFAULT_TEAM_LOGO } from "../../core/entities/Team";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  TeamRepository,
  TeamFilter,
} from "../../core/interfaces/adapters/TeamRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "team";

export class InBrowserTeamRepository
  extends InBrowserBaseRepository<Team, CreateTeamInput, UpdateTeamInput>
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
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Team {
    return {
      id,
      ...timestamps,
      name: input.name,
      short_name: input.short_name,
      description: input.description,
      organization_id: input.organization_id,
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
    };
  }

  protected apply_updates_to_entity(
    entity: Team,
    updates: UpdateTeamInput,
  ): Team {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: TeamFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team> {
    try {
      let filtered_entities = await this.database.teams.toArray();

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

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to filter teams: ${error_message}`);
    }
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Team> {
    return this.find_by_filter({ organization_id }, options);
  }

  async find_active_teams(options?: QueryOptions): PaginatedAsyncResult<Team> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

export function create_default_teams(): Team[] {
  const now = new Date().toISOString();

  return [
    {
      id: "team_default_1",
      name: "Weatherhead Hockey Club",
      short_name: "WHC",
      description:
        "One of Uganda's most prestigious field hockey clubs, known for technical excellence and youth development",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#1E3A8A",
      secondary_color: "#FFFFFF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://weatherheadhc.ug",
      founded_year: 1985,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_2",
      name: "Kampala Hockey Club",
      short_name: "KHC",
      description:
        "Founding member of the Uganda Hockey Association with a rich history and passionate supporter base",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#DC2626",
      secondary_color: "#FBBF24",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://kampalahc.ug",
      founded_year: 1972,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_3",
      name: "Rockets Hockey Club",
      short_name: "RHC",
      description:
        "Dynamic hockey club known for fast-paced attacking play and team spirit",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_4",
      primary_color: "#F59E0B",
      secondary_color: "#1F2937",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://rocketshc.ug",
      founded_year: 1998,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_4",
      name: "Wananchi Hockey Club",
      short_name: "WAN",
      description:
        "Grassroots hockey club committed to making hockey accessible to all Ugandans",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_5",
      primary_color: "#16A34A",
      secondary_color: "#FFFFFF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://wananchihc.ug",
      founded_year: 2005,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_5",
      name: "Makerere University Hockey Club",
      short_name: "MAK",
      description:
        "Elite university hockey team combining academic excellence with sporting prowess",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 22,
      home_venue_id: "venue_default_3",
      primary_color: "#7C3AED",
      secondary_color: "#F3E8FF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://mak.ac.ug/hockey",
      founded_year: 1980,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_6",
      name: "Kyambogo University Hockey Club",
      short_name: "KYU",
      description:
        "Rising force in Ugandan university hockey with strong support and excellent facilities",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 22,
      home_venue_id: "venue_default_2",
      primary_color: "#0891B2",
      secondary_color: "#ECFEFF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://kyu.ac.ug/hockey",
      founded_year: 2002,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_7",
      name: "Simba Hockey Club",
      short_name: "SIM",
      description:
        "Fierce competitors known for disciplined defense and tactical awareness",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_5",
      primary_color: "#EA580C",
      secondary_color: "#1F2937",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://simbahc.ug",
      founded_year: 2010,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_8",
      name: "Strikers Hockey Club",
      short_name: "STR",
      description:
        "Goal-scoring specialists known for entertaining attacking hockey",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#DB2777",
      secondary_color: "#FDF2F8",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://strikershc.ug",
      founded_year: 2015,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserTeamRepository | null = null;

export function get_team_repository(): TeamRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserTeamRepository();
  }
  return singleton_instance;
}

export async function initialize_team_repository(): Promise<void> {
  const repository = get_team_repository() as InBrowserTeamRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_teams());
  }
}

export async function reset_team_repository(): Promise<void> {
  const repository = get_team_repository() as InBrowserTeamRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_teams());
}
