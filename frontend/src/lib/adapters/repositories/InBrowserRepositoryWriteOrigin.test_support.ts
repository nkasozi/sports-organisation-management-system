import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { SportSyncDatabase } from "./database";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

interface OriginTestTeam extends BaseEntity {
  name: string;
}

interface OriginTestTeamInput {
  name: string;
}

const ORIGIN_TEST_TEAM_PREFIX = "team";
const ORIGIN_TEST_TABLE_NAME = "teams";

class OriginTestTeamRepository extends InBrowserBaseRepository<
  OriginTestTeam,
  OriginTestTeamInput,
  Partial<OriginTestTeamInput>
> {
  private readonly test_database: SportSyncDatabase;

  constructor(test_database: SportSyncDatabase) {
    super(ORIGIN_TEST_TEAM_PREFIX);
    this.test_database = test_database;
  }

  protected get_table(): Table<OriginTestTeam, string> {
    return this.test_database.table(ORIGIN_TEST_TABLE_NAME);
  }

  protected create_entity_from_input(
    input: OriginTestTeamInput,
    id: OriginTestTeam["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): OriginTestTeam {
    return { ...input, id, ...timestamps };
  }

  protected apply_updates_to_entity(
    entity: OriginTestTeam,
    updates: Partial<OriginTestTeamInput>,
  ): OriginTestTeam {
    return { ...entity, ...updates };
  }
}

export function create_origin_test_team_repository(
  test_database: SportSyncDatabase,
): OriginTestTeamRepository {
  return new OriginTestTeamRepository(test_database);
}

export function build_origin_test_team(id: string): OriginTestTeam {
  return {
    id: id as OriginTestTeam["id"],
    name: id,
    created_at: "2024-05-01T00:00:00.000Z" as OriginTestTeam["created_at"],
    updated_at: "2024-05-01T00:00:00.000Z" as OriginTestTeam["updated_at"],
  };
}
