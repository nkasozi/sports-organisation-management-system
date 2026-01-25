import type {
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorHolderType,
} from "../../entities/JerseyColor";
import type { Repository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";

export interface JerseyColorFilter {
  holder_type?: JerseyColorHolderType;
  holder_id?: string;
  nickname?: string;
  main_color?: string;
  status?: string;
}

export interface JerseyColorRepository extends Repository<
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput
> {
  find_by_filter(
    filter: JerseyColorFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
  find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
}
