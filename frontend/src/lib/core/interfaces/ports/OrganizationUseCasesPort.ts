import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../../entities/Organization";
import type { OrganizationFilter } from "../adapters/OrganizationRepository";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface OrganizationUseCasesPort extends BaseUseCasesPort<
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilter
> {
  delete_organizations(ids: string[]): Promise<AsyncResult<number>>;
}
