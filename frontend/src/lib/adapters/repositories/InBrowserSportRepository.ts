import type { Table } from "dexie";
import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
} from "../../core/entities/Sport";
import {
  create_football_sport_preset,
  create_basketball_sport_preset,
  create_field_hockey_sport_preset,
} from "../../core/entities/Sport";
import type {
  SportRepository,
  SportFilter,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "sport";

let default_sports_cache: Sport[] | null = null;

function create_default_sports(): Sport[] {
  const now = new Date().toISOString();

  const football: Sport = {
    id: `${ENTITY_PREFIX}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    created_at: now,
    updated_at: now,
    ...create_football_sport_preset(),
  };

  const basketball: Sport = {
    id: `${ENTITY_PREFIX}-${Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`,
    created_at: now,
    updated_at: now,
    ...create_basketball_sport_preset(),
  };

  const field_hockey: Sport = {
    id: `${ENTITY_PREFIX}-${Date.now() + 2}-${Math.random().toString(36).substring(2, 9)}`,
    created_at: now,
    updated_at: now,
    ...create_field_hockey_sport_preset(),
  };

  return [football, basketball, field_hockey];
}

export class InBrowserSportRepository
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
    return {
      id,
      ...timestamps,
      ...input,
    };
  }

  protected apply_updates_to_entity(
    entity: Sport,
    updates: UpdateSportInput,
  ): Sport {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: Sport[],
    filter: SportFilter,
  ): Sport[] {
    let filtered = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((sport) =>
        sport.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.status) {
      filtered = filtered.filter((sport) => sport.status === filter.status);
    }

    return filtered;
  }

  async find_by_code(code: string): Promise<Sport | null> {
    const all_sports = await this.get_table().toArray();
    return (
      all_sports.find(
        (sport) => sport.code.toLowerCase() === code.toLowerCase(),
      ) || null
    );
  }

  async find_active(): Promise<Sport[]> {
    const all_sports = await this.get_table().toArray();
    return all_sports.filter((sport) => sport.status === "active");
  }
}

export function get_sport_id_by_code_sync(code: string): string | null {
  if (!default_sports_cache) {
    default_sports_cache = create_default_sports();
  }

  const sport = default_sports_cache.find(
    (s) => s.code.toLowerCase() === code.toLowerCase(),
  );
  return sport ? sport.id : null;
}

let singleton_instance: InBrowserSportRepository | null = null;

export function get_sport_repository(): SportRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserSportRepository();
  }
  return singleton_instance;
}

function get_concrete_repository(): InBrowserSportRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserSportRepository();
  }
  return singleton_instance;
}

export async function ensure_default_sports_exist(): Promise<void> {
  const repository = get_concrete_repository();
  const has_data = await repository.has_data();

  if (!has_data) {
    if (!default_sports_cache) {
      default_sports_cache = create_default_sports();
    }
    await repository.seed_with_data(default_sports_cache);
  }
}

export async function reset_sport_repository(): Promise<void> {
  const repository = get_concrete_repository();
  await repository.clear_all_data();
  default_sports_cache = null;
  default_sports_cache = create_default_sports();
  await repository.seed_with_data(default_sports_cache);
}

export async function get_all_sports(): Promise<Sport[]> {
  await ensure_default_sports_exist();
  const repository = get_concrete_repository();
  const result = await repository.find_all();
  return result.success && result.data ? result.data.items : [];
}

export async function get_sport_by_id(id: string): Promise<Sport | null> {
  const repository = get_concrete_repository();
  const result = await repository.find_by_id(id);
  return result.success && result.data ? result.data : null;
}

export async function get_sport_by_code(code: string): Promise<Sport | null> {
  const repository = get_concrete_repository();
  return repository.find_by_code(code);
}

export async function create_sport(input: CreateSportInput): Promise<Sport> {
  const repository = get_concrete_repository();
  const result = await repository.create(input);
  if (!result.success) {
    throw new Error(result.error || "Failed to create sport");
  }
  return result.data;
}

export async function update_sport(
  id: string,
  input: UpdateSportInput,
): Promise<Sport | null> {
  const repository = get_concrete_repository();
  const result = await repository.update(id, input);
  return result.success && result.data ? result.data : null;
}

export async function delete_sport(id: string): Promise<boolean> {
  const repository = get_concrete_repository();
  const result = await repository.delete_by_id(id);
  return result.success && result.data === true;
}

export async function get_active_sports(): Promise<Sport[]> {
  const repository = get_concrete_repository();
  return repository.find_active();
}
