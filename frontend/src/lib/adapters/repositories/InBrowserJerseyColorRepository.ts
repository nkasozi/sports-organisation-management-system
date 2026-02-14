import type { Table } from "dexie";
import type {
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorHolderType,
} from "../../core/entities/JerseyColor";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  JerseyColorRepository,
  JerseyColorFilter,
} from "../../core/interfaces/adapters/JerseyColorRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "jersey";

export class InBrowserJerseyColorRepository
  extends InBrowserBaseRepository<
    JerseyColor,
    CreateJerseyColorInput,
    UpdateJerseyColorInput
  >
  implements JerseyColorRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<JerseyColor, string> {
    return this.database.jersey_colors;
  }

  protected create_entity_from_input(
    input: CreateJerseyColorInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): JerseyColor {
    return {
      id,
      ...timestamps,
      holder_type: input.holder_type,
      holder_id: input.holder_id,
      nickname: input.nickname,
      main_color: input.main_color,
      secondary_color: input.secondary_color || "",
      tertiary_color: input.tertiary_color || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: JerseyColor,
    updates: UpdateJerseyColorInput,
  ): JerseyColor {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: JerseyColorFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor> {
    try {
      let filtered_entities = await this.database.jersey_colors.toArray();

      if (filter.holder_type) {
        filtered_entities = filtered_entities.filter(
          (jersey) => jersey.holder_type === filter.holder_type,
        );
      }

      if (filter.holder_id) {
        filtered_entities = filtered_entities.filter(
          (jersey) => jersey.holder_id === filter.holder_id,
        );
      }

      if (filter.nickname) {
        const nickname_lower = filter.nickname.toLowerCase();
        filtered_entities = filtered_entities.filter((jersey) =>
          jersey.nickname.toLowerCase().includes(nickname_lower),
        );
      }

      if (filter.main_color) {
        const color_lower = filter.main_color.toLowerCase();
        filtered_entities = filtered_entities.filter(
          (jersey) => jersey.main_color.toLowerCase() === color_lower,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (jersey) => jersey.status === filter.status,
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
      return create_failure_result(
        `Failed to filter jersey colors: ${error_message}`,
      );
    }
  }

  async find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor> {
    return this.find_by_filter({ holder_type, holder_id }, options);
  }
}

export function create_default_jersey_colors(): JerseyColor[] {
  const now = new Date().toISOString();

  return [
    {
      id: "jersey_default_home",
      holder_type: "team",
      holder_id: "team_default_1",
      nickname: "Home Kit",
      main_color: "#1E40AF",
      secondary_color: "#FFFFFF",
      tertiary_color: "#F59E0B",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "jersey_default_away",
      holder_type: "team",
      holder_id: "team_default_1",
      nickname: "Away Kit",
      main_color: "#FFFFFF",
      secondary_color: "#1E40AF",
      tertiary_color: "#F59E0B",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "jersey_default_official_1",
      holder_type: "competition_official",
      holder_id: "comp_default_1",
      nickname: "Official Uniform",
      main_color: "#000000",
      secondary_color: "#FFFFFF",
      tertiary_color: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "jersey_default_official_2",
      holder_type: "competition_official",
      holder_id: "comp_default_2",
      nickname: "Official Uniform",
      main_color: "#1F2937",
      secondary_color: "#FFFFFF",
      tertiary_color: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "jersey_default_official_3",
      holder_type: "competition_official",
      holder_id: "comp_default_3",
      nickname: "Official Uniform",
      main_color: "#6B7280",
      secondary_color: "#1F2937",
      tertiary_color: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "jersey_default_official_4",
      holder_type: "competition_official",
      holder_id: "comp_default_4",
      nickname: "Official Uniform",
      main_color: "#FFFFFF",
      secondary_color: "#1F2937",
      tertiary_color: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserJerseyColorRepository | null = null;

export function get_jersey_color_repository(): JerseyColorRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserJerseyColorRepository();
  }
  return singleton_instance;
}

export async function initialize_jersey_color_repository(): Promise<void> {
  const repository =
    get_jersey_color_repository() as InBrowserJerseyColorRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_jersey_colors());
  }
}

export async function reset_jersey_color_repository(): Promise<void> {
  const repository =
    get_jersey_color_repository() as InBrowserJerseyColorRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_jersey_colors());
}
