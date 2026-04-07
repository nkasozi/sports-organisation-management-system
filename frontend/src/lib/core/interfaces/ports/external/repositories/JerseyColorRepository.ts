import type {
  CreateJerseyColorInput,
  JerseyColor,
  JerseyColorHolderType,
  UpdateJerseyColorInput,
} from "../../../../entities/JerseyColor";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

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
  UpdateJerseyColorInput,
  JerseyColorFilter
> {
  find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
}
