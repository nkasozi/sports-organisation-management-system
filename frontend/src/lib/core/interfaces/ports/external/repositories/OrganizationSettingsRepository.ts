import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../../../../entities/OrganizationSettings";
import type { AsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface OrganizationSettingsFilter {
  organization_id?: OrganizationSettings["organization_id"];
}

export interface OrganizationSettingsRepository extends Repository<
  OrganizationSettings,
  CreateOrganizationSettingsInput,
  UpdateOrganizationSettingsInput,
  OrganizationSettingsFilter
> {
  find_by_organization_id(
    organization_id: OrganizationSettings["organization_id"],
    options?: QueryOptions,
  ): AsyncResult<OrganizationSettings | null>;
}
