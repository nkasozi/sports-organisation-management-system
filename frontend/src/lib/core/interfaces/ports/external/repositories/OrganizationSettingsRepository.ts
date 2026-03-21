import type {
  OrganizationSettings,
  CreateOrganizationSettingsInput,
  UpdateOrganizationSettingsInput,
} from "../../../../entities/OrganizationSettings";
import type { Repository, QueryOptions } from "./Repository";
import type { AsyncResult } from "../../../../types/Result";

export interface OrganizationSettingsFilter {
  organization_id?: string;
}

export interface OrganizationSettingsRepository extends Repository<
  OrganizationSettings,
  CreateOrganizationSettingsInput,
  UpdateOrganizationSettingsInput,
  OrganizationSettingsFilter
> {
  find_by_organization_id(
    organization_id: string,
    options?: QueryOptions,
  ): AsyncResult<OrganizationSettings | null>;
}
