import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../../../entities/ActivityCategory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { ActivityCategoryFilter } from "../../external/repositories/ActivityCategoryRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface ActivityCategoryUseCasesPort extends BaseUseCasesPort<
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
  ActivityCategoryFilter
> {
  list_by_organization(
    organization_id: ScalarValueInput<ActivityCategory["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory>;

  ensure_default_categories_exist(
    organization_id: ScalarValueInput<ActivityCategory["organization_id"]>,
  ): AsyncResult<{ categories_created: number }>;
}
