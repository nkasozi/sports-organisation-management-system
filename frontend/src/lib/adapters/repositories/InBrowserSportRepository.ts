import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../../core/entities/Sport";
import {
  create_basketball_sport_preset,
  create_field_hockey_sport_preset,
  create_football_sport_preset,
} from "../../core/entities/Sport";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type { SportFilter, SportRepository } from "../../core/interfaces/ports";
import type { Result } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "sport";

export const DEFAULT_SPORT_IDS = {
  FOOTBALL: "sport-football-default",
  BASKETBALL: "sport-basketball-default",
  FIELD_HOCKEY: "sport-field-hockey-default",
};

const SPORT_ID_BY_CODE: Record<string, string> = {
  FOOTBALL: DEFAULT_SPORT_IDS.FOOTBALL,
  BASKETBALL: DEFAULT_SPORT_IDS.BASKETBALL,
  FIELD_HOCKEY: DEFAULT_SPORT_IDS.FIELD_HOCKEY,
};

function create_default_sports(): Sport[] {
  const now = new Date().toISOString();
  return [
    {
      id: DEFAULT_SPORT_IDS.FOOTBALL,
      created_at: now,
      updated_at: now,
      ...create_football_sport_preset(),
    },
    {
      id: DEFAULT_SPORT_IDS.BASKETBALL,
      created_at: now,
      updated_at: now,
      ...create_basketball_sport_preset(),
    },
    {
      id: DEFAULT_SPORT_IDS.FIELD_HOCKEY,
      created_at: now,
      updated_at: now,
      ...create_field_hockey_sport_preset(),
    },
  ];
}

class InBrowserSportRepository
  extends InBrowserBaseRepository<
    Sport,
    CreateSportInput,
    UpdateSportInput,
    SportFilter
  >
  implements SportRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Sport, string> {
    return this.database.sports;
  }

  protected create_entity_from_input(
    input: CreateSportInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Sport {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: Sport,
    updates: UpdateSportInput,
  ): Sport {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: Sport[],
    filter: SportFilter,
  ): Sport[] {
    let filtered = entities;
    if (filter.name_contains) {
      const term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(term));
    }
    if (filter.status) {
      filtered = filtered.filter((s) => s.status === filter.status);
    }
    return filtered;
  }

  async find_by_code(code: string): Promise<Sport | null> {
    const all = await this.get_table().toArray();
    return all.find((s) => s.code.toLowerCase() === code.toLowerCase()) || null;
  }

  async find_active(): Promise<Sport[]> {
    const all = await this.get_table().toArray();
    return all.filter((s) => s.status === ENTITY_STATUS.ACTIVE);
  }
}

export function get_sport_id_by_code_sync(code: string): string | null {
  return SPORT_ID_BY_CODE[code.toUpperCase()] ?? null;
}

let singleton_instance: InBrowserSportRepository | null = null;

function get_concrete_repository(): InBrowserSportRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserSportRepository();
  }
  return singleton_instance;
}

export function get_sport_repository(): SportRepository {
  return get_concrete_repository();
}

async function ensure_default_sports_exist(): Promise<void> {
  const repo = get_concrete_repository();
  if (!(await repo.has_data())) {
    await repo.seed_with_data(create_default_sports());
  }
}

export async function reset_sport_repository(): Promise<Sport[]> {
  const repo = get_concrete_repository();
  await repo.clear_all_data();
  const default_sports = create_default_sports();
  await repo.seed_with_data(default_sports);
  console.log("[SportRepository] Reset complete", {
    event: "sport_repository_reset",
    sport_count: default_sports.length,
    sport_ids: default_sports.map((sport) => sport.id),
  });
  return default_sports;
}

export async function get_all_sports(): Promise<Sport[]> {
  await ensure_default_sports_exist();
  const result = await get_concrete_repository().find_all();
  return result.success && result.data ? result.data.items : [];
}

export async function get_sport_by_id(id: string): Promise<Sport | null> {
  const result = await get_concrete_repository().find_by_id(id);
  return result.success && result.data ? result.data : null;
}

export async function get_sport_by_code(code: string): Promise<Sport | null> {
  return get_concrete_repository().find_by_code(code);
}

export async function create_sport(
  input: CreateSportInput,
): Promise<Result<Sport>> {
  const result = await get_concrete_repository().create(input);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to create sport" };
  }
  return { success: true, data: result.data };
}

export async function update_sport(
  id: string,
  input: UpdateSportInput,
): Promise<Sport | null> {
  const result = await get_concrete_repository().update(id, input);
  return result.success && result.data ? result.data : null;
}

export async function delete_sport(id: string): Promise<boolean> {
  const result = await get_concrete_repository().delete_by_id(id);
  return result.success && result.data === true;
}

export async function get_active_sports(): Promise<Sport[]> {
  return get_concrete_repository().find_active();
}
