import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../../../../entities/OrganizationSettings";
import type { AsyncResult } from "../../../../types/Result";

export interface OrganizationSettingsUseCasesPort {
  get_by_organization_id(
    organization_id: string,
  ): AsyncResult<OrganizationSettings | null>;

  save_settings(
    caller_role: string,
    input: CreateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;

  update_settings(
    caller_role: string,
    id: string,
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;

  save_or_update(
    caller_role: string,
    organization_id: string,
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;
}
