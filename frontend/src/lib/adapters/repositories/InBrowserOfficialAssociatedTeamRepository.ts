import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateOfficialAssociatedTeamInput,
  OfficialAssociatedTeam,
  UpdateOfficialAssociatedTeamInput,
} from "../../core/entities/OfficialAssociatedTeam";
import type {
  OfficialAssociatedTeamFilter,
  OfficialAssociatedTeamRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "oat";

class InBrowserOfficialAssociatedTeamRepository
  extends InBrowserBaseRepository<
    OfficialAssociatedTeam,
    CreateOfficialAssociatedTeamInput,
    UpdateOfficialAssociatedTeamInput,
    OfficialAssociatedTeamFilter
  >
  implements OfficialAssociatedTeamRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<OfficialAssociatedTeam, string> {
    return this.database.official_associated_teams;
  }

  protected create_entity_from_input(
    input: CreateOfficialAssociatedTeamInput,
    id: OfficialAssociatedTeam["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): OfficialAssociatedTeam {
    return {
      id,
      ...timestamps,
      official_id: input.official_id,
      team_id: input.team_id,
      association_type: input.association_type,
      start_date: input.start_date || "",
      end_date: input.end_date || "",
      notes: input.notes || "",
      status: input.status,
    } as OfficialAssociatedTeam;
  }

  protected apply_updates_to_entity(
    entity: OfficialAssociatedTeam,
    updates: UpdateOfficialAssociatedTeamInput,
  ): OfficialAssociatedTeam {
    return {
      ...entity,
      ...updates,
    } as OfficialAssociatedTeam;
  }

  protected apply_entity_filter(
    entities: OfficialAssociatedTeam[],
    filter: OfficialAssociatedTeamFilter,
  ): OfficialAssociatedTeam[] {
    let filtered = entities;

    if (filter.official_id) {
      filtered = filtered.filter(
        (oat) => oat.official_id === filter.official_id,
      );
    }

    if (filter.team_id) {
      filtered = filtered.filter((oat) => oat.team_id === filter.team_id);
    }

    if (filter.association_type) {
      filtered = filtered.filter(
        (oat) => oat.association_type === filter.association_type,
      );
    }

    if (filter.status) {
      filtered = filtered.filter((oat) => oat.status === filter.status);
    }

    return filtered;
  }

  async find_by_official(
    official_id: OfficialAssociatedTeam["official_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam> {
    return this.find_all({ official_id }, options);
  }

  async find_by_team(
    team_id: OfficialAssociatedTeam["team_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialAssociatedTeam> {
    return this.find_all({ team_id }, options);
  }
}

function create_default_official_associated_teams(): import("$lib/core/types/DomainScalars").ScalarInput<OfficialAssociatedTeam>[] {
  return [];
}

type OfficialAssociatedTeamRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserOfficialAssociatedTeamRepository;
    };

let official_associated_team_repository_state: OfficialAssociatedTeamRepositoryState =
  {
    status: "uninitialized",
  };

export function get_official_associated_team_repository(): OfficialAssociatedTeamRepository {
  if (official_associated_team_repository_state.status === "ready") {
    return official_associated_team_repository_state.repository;
  }

  const repository = new InBrowserOfficialAssociatedTeamRepository();
  official_associated_team_repository_state = {
    status: "ready",
    repository,
  };

  return repository;
}
