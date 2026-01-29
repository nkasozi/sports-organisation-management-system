import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../entities/ActivityCategory";
import type { ActivityCategoryFilter } from "../adapters/ActivityCategoryRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
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
  ): Promise<PaginatedAsyncResult<ActivityCategory>>;

  ensure_default_categories_exist(
    organization_id: string,
  ): Promise<{ success: boolean; categories_created: number }>;
}
