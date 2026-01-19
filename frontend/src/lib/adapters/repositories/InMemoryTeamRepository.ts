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
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_teams";
const ENTITY_PREFIX = "team";

export class InMemoryTeamRepository
  extends InMemoryBaseRepository<Team, CreateTeamInput, UpdateTeamInput>
  implements TeamRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
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
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

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
    const paginated_entities = this.apply_pagination_and_sort(
      filtered_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
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

function create_default_teams(): Team[] {
  const now = new Date().toISOString();

  return [
    {
      id: "team_default_1",
      name: "Red Dragons FC",
      short_name: "RDF",
      description: "Established football club with a strong youth program",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue-1",
      primary_color: "#DC2626",
      secondary_color: "#FFFFFF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://reddragons.example.com",
      founded_year: 2010,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_2",
      name: "Blue Thunder United",
      short_name: "BTU",
      description: "Competitive club focusing on tactical excellence",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 25,
      home_venue_id: "venue-2",
      primary_color: "#2563EB",
      secondary_color: "#F0F9FF",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://bluethunder.example.com",
      founded_year: 2012,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_3",
      name: "Golden Eagles",
      short_name: "GEA",
      description: "Championship-winning team with experienced squad",
      organization_id: "org_default_1",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 28,
      home_venue_id: "venue-3",
      primary_color: "#F59E0B",
      secondary_color: "#1F2937",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://goldeneagles.example.com",
      founded_year: 2008,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_4",
      name: "Storm Basketball",
      short_name: "STB",
      description: "Professional basketball team",
      organization_id: "org_default_2",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 15,
      home_venue_id: "venue-4",
      primary_color: "#7C3AED",
      secondary_color: "#EDE9FE",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://stormbasketball.example.com",
      founded_year: 2015,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_5",
      name: "International Hawks",
      short_name: "IH",
      description: "Elite field hockey team competing at international level",
      organization_id: "org_default_4",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 16,
      home_venue_id: "venue-5",
      primary_color: "#1F2937",
      secondary_color: "#FBBF24",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://internationalhawks.example.com",
      founded_year: 2005,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "team_default_6",
      name: "Green Dragons",
      short_name: "GD",
      description: "Dynamic field hockey team with strong defensive lineup",
      organization_id: "org_default_4",
      captain_player_id: null,
      vice_captain_player_id: null,
      max_squad_size: 16,
      home_venue_id: "venue-6",
      primary_color: "#16A34A",
      secondary_color: "#E0F2FE",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://greendragon.example.com",
      founded_year: 2010,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InMemoryTeamRepository | null = null;

export function get_team_repository(): TeamRepository {
  if (!singleton_instance) {
    singleton_instance = new InMemoryTeamRepository();
    singleton_instance["ensure_cache_initialized"]();
  }

  return singleton_instance;
}

export function reset_team_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
  }
}
