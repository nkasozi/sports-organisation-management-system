import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../../../../entities/OrganizationSettings";
import type { AsyncResult } from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

const ORGANIZATION_SETTINGS_NOT_FOUND_ERROR_PREFIX =
  "Organization settings not found";

export function build_organization_settings_not_found_error(
  organization_id: OrganizationSettings["organization_id"],
): string {
  return `${ORGANIZATION_SETTINGS_NOT_FOUND_ERROR_PREFIX}: organization_id=${organization_id}`;
}

export function is_organization_settings_not_found_error(
  error: string,
  organization_id: OrganizationSettings["organization_id"],
): boolean {
  return error === build_organization_settings_not_found_error(organization_id);
}

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
  ): AsyncResult<OrganizationSettings>;
}
