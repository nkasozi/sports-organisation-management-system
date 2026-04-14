import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "../../../../entities/Organization";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { AsyncResult } from "../../../../types/Result";
import type { OrganizationFilter } from "../../external/repositories/OrganizationRepository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface OrganizationUseCasesPort extends BaseUseCasesPort<
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilter
> {
  delete_organizations(
    ids: Array<ScalarValueInput<Organization["id"]>>,
  ): AsyncResult<number>;
}
