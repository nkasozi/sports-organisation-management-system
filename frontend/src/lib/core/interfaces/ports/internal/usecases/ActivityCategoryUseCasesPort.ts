import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../../../entities/ActivityCategory";
import type { ActivityCategoryFilter } from "../../external/repositories/ActivityCategoryRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { PaginatedAsyncResult, AsyncResult } from "../../../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface ActivityCategoryUseCasesPort extends BaseUseCasesPort<
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
  ActivityCategoryFilter
> {
  list_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory>;

  ensure_default_categories_exist(
    organization_id: string,
  ): AsyncResult<{ categories_created: number }>;
}
