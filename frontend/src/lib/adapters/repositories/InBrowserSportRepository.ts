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
} from "../../core/interfaces/adapters/SportRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { get_database } from "./database";

function generate_sport_id(): string {
  return `sport-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

let default_sports_cache: Sport[] | null = null;

function get_default_sports(): Sport[] {
  if (default_sports_cache) {
    return default_sports_cache;
  }

  const now = new Date().toISOString();

  const football: Sport = {
    id: generate_sport_id(),
    created_at: now,
    updated_at: now,
    ...create_football_sport_preset(),
  };

  const basketball: Sport = {
    id: generate_sport_id(),
    created_at: now,
    updated_at: now,
    ...create_basketball_sport_preset(),
  };

  const field_hockey: Sport = {
    id: generate_sport_id(),
    created_at: now,
    updated_at: now,
    ...create_field_hockey_sport_preset(),
  };

  default_sports_cache = [football, basketball, field_hockey];
  return default_sports_cache;
}

export async function ensure_default_sports_exist(): Promise<void> {
  const db = get_database();
  const count = await db.sports.count();

  if (count === 0) {
    const default_sports = get_default_sports();
    await db.sports.bulkPut(default_sports);
  }
}

export async function reset_sport_repository(): Promise<void> {
  const db = get_database();
  await db.sports.clear();
  default_sports_cache = null;
  await ensure_default_sports_exist();
}

export async function get_all_sports(): Promise<Sport[]> {
  await ensure_default_sports_exist();
  const db = get_database();
  return db.sports.toArray();
}

export async function get_sport_by_id(id: string): Promise<Sport | null> {
  const db = get_database();
  const sport = await db.sports.get(id);
  return sport || null;
}

export async function get_sport_by_code(code: string): Promise<Sport | null> {
  const db = get_database();
  const sports = await db.sports.toArray();
  return (
    sports.find((s) => s.code.toLowerCase() === code.toLowerCase()) || null
  );
}

export function get_sport_id_by_code_sync(code: string): string | null {
  const default_sports = get_default_sports();
  const sport = default_sports.find(
    (s) => s.code.toLowerCase() === code.toLowerCase(),
  );
  return sport ? sport.id : null;
}

export async function create_sport(input: CreateSportInput): Promise<Sport> {
  const db = get_database();
  const now = new Date().toISOString();

  const new_sport: Sport = {
    id: generate_sport_id(),
    created_at: now,
    updated_at: now,
    ...input,
  };

  await db.sports.add(new_sport);
  return new_sport;
}

export async function update_sport(
  id: string,
  input: UpdateSportInput,
): Promise<Sport | null> {
  const db = get_database();
  const existing = await db.sports.get(id);

  if (!existing) return null;

  const updated_sport: Sport = {
    ...existing,
    ...input,
    updated_at: new Date().toISOString(),
  };

  await db.sports.put(updated_sport);
  return updated_sport;
}

export async function delete_sport(id: string): Promise<boolean> {
  const db = get_database();
  const existing = await db.sports.get(id);

  if (!existing) return false;

  await db.sports.delete(id);
  return true;
}

export async function get_active_sports(): Promise<Sport[]> {
  const db = get_database();
  const sports = await db.sports.toArray();
  return sports.filter((s) => s.status === "active");
}

export const inBrowserSportRepository = {
  get_all: get_all_sports,
  get_by_id: get_sport_by_id,
  get_by_code: get_sport_by_code,
  create: create_sport,
  update: update_sport,
  delete: delete_sport,
  get_active: get_active_sports,
};

export function get_sport_repository(): SportRepository {
  return {
    async find_all(options?: QueryOptions): PaginatedAsyncResult<Sport> {
      const sports = await get_all_sports();
      return create_success_result({
        items: sports,
        total_count: sports.length,
        page_number: 1,
        page_size: sports.length,
        total_pages: 1,
      });
    },

    async find_by_id(id: string): AsyncResult<Sport> {
      const sport = await get_sport_by_id(id);
      if (!sport) {
        return create_failure_result(`Sport with ID ${id} not found`);
      }
      return create_success_result(sport);
    },

    async find_by_ids(ids: string[]): AsyncResult<Sport[]> {
      const sports = await get_all_sports();
      const found = sports.filter((s) => ids.includes(s.id));
      return create_success_result(found);
    },

    async create(input: CreateSportInput): AsyncResult<Sport> {
      const sport = await create_sport(input);
      return create_success_result(sport);
    },

    async update(id: string, input: UpdateSportInput): AsyncResult<Sport> {
      const sport = await update_sport(id, input);
      if (!sport) {
        return create_failure_result(`Sport with ID ${id} not found`);
      }
      return create_success_result(sport);
    },

    async delete_by_id(id: string): AsyncResult<boolean> {
      const deleted = await delete_sport(id);
      if (!deleted) {
        return create_failure_result(`Sport with ID ${id} not found`);
      }
      return create_success_result(true);
    },

    async delete_by_ids(ids: string[]): AsyncResult<number> {
      let count = 0;
      for (const id of ids) {
        const deleted = await delete_sport(id);
        if (deleted) count++;
      }
      return create_success_result(count);
    },

    async count(): AsyncResult<number> {
      const sports = await get_all_sports();
      return create_success_result(sports.length);
    },

    async find_by_filter(
      filter?: SportFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Sport> {
      let sports = await get_all_sports();

      if (filter) {
        if (filter.name_contains) {
          sports = sports.filter((s) =>
            s.name.toLowerCase().includes(filter.name_contains!.toLowerCase()),
          );
        }
        if (filter.status) {
          sports = sports.filter((s) => s.status === filter.status);
        }
      }

      return create_success_result({
        items: sports,
        total_count: sports.length,
        page_number: 1,
        page_size: sports.length,
        total_pages: 1,
      });
    },
  };
}
