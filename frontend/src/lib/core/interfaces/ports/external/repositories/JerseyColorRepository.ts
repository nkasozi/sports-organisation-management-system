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
  holder_id?: JerseyColor["holder_id"];
  nickname?: JerseyColor["nickname"];
  main_color?: string;
  status?: JerseyColor["status"];
}

export interface JerseyColorRepository extends Repository<
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorFilter
> {
  find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: JerseyColor["holder_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor>;
}
