import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../../../../entities/OrganizationSettings";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { AsyncResult } from "../../../../types/Result";

export interface OrganizationSettingsUseCasesPort {
  get_by_organization_id(
    organization_id: ScalarValueInput<OrganizationSettings["organization_id"]>,
  ): AsyncResult<OrganizationSettings>;

  save_settings(
    caller_role: string,
    input: CreateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;

  update_settings(
    caller_role: string,
    id: ScalarValueInput<OrganizationSettings["id"]>,
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;

  save_or_update(
    caller_role: string,
    organization_id: ScalarValueInput<OrganizationSettings["organization_id"]>,
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings>;
}
