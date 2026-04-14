import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "../entities/Organization";
import { validate_organization_input } from "../entities/Organization";
import type {
  OrganizationFilter,
  OrganizationRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { OrganizationUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

export type OrganizationUseCases = OrganizationUseCasesPort;

export function create_organization_use_cases(
  repository: OrganizationRepository,
): OrganizationUseCases {
  return {
    async list(
      filter?: OrganizationFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Organization> {
      return repository.find_all(filter, options);
    },

    async get_by_id(
      id: ScalarValueInput<Organization["id"]>,
    ): AsyncResult<Organization> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateOrganizationInput): AsyncResult<Organization> {
      const validation_errors = validate_organization_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(input);
    },

    async update(
      id: ScalarValueInput<Organization["id"]>,
      input: UpdateOrganizationInput,
    ): AsyncResult<Organization> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.update(id, input);
    },

    async delete(
      id: ScalarValueInput<Organization["id"]>,
    ): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Organization ID is required");
      }
      return repository.delete_by_id(id);
    },

    async delete_organizations(
      ids: Array<ScalarValueInput<Organization["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result(
          "At least one organization ID is required",
        );
      }
      return repository.delete_by_ids(ids);
    },
  };
}

type OrganizationDefaultSeeder = (
  organization_id: ScalarValueInput<Organization["id"]>,
) => Promise<void>;

export function create_organization_use_cases_with_default_seeder(
  org_repo: OrganizationRepository,
  seed_defaults: OrganizationDefaultSeeder,
): OrganizationUseCases {
  const base = create_organization_use_cases(org_repo);

  return {
    ...base,
    async create(input: CreateOrganizationInput): AsyncResult<Organization> {
      const result = await base.create(input);

      if (!result.success) return result;

      seed_defaults(result.data.id).catch((error) =>
        console.error("[OrganizationUseCases] Failed to seed defaults", {
          event: "organization_seed_defaults_failed",
          organization_id: result.data.id,
          error: String(error),
        }),
      );

      return result;
    },
  };
}

function await_import() {
  return {
    seed_default_lookup_entities_for_organization: async (
      organization_id: ScalarValueInput<Organization["id"]>,
    ) => {
      const { seed_default_lookup_entities_for_organization: seeder } =
        await import("../../adapters/initialization/organizationDefaultsSeeder");
      return seeder(organization_id);
    },
  };
}
