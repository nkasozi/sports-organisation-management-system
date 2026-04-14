import type {
  ActivityCategory,
  ActivityCategoryType,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../../../entities/ActivityCategory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface ActivityCategoryFilter {
  name_contains?: string;
  organization_id?: ScalarValueInput<ActivityCategory["organization_id"]>;
  category_type?: ActivityCategoryType;
  is_system_generated?: boolean;
}

export interface ActivityCategoryRepository extends FilterableRepository<
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
  ActivityCategoryFilter
> {
  find_by_organization(
    organization_id: ScalarValueInput<ActivityCategory["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory>;

  find_by_category_type(
    organization_id: ScalarValueInput<ActivityCategory["organization_id"]>,
    category_type: ActivityCategoryType,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory>;
}
