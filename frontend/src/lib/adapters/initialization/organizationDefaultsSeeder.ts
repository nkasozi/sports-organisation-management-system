import type { Organization } from "../../core/entities/Organization";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  type RepositoryWriteOrigin,
  USER_WRITE_ORIGIN,
} from "../repositories/InBrowserRepositoryWriteOrigin";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import {
  build_reference_data_steps,
  build_role_and_format_steps,
  type OrgSeedCountKey,
  type OrgSeedResult,
  type OrgSeedStep,
  type OrgSeedStepName,
} from "./organizationDefaultsSeedSteps";

const STEP_NAME_SEPARATOR = /_/g;
const DISPLAY_NAME_SEPARATOR = " ";

function create_step_failure_message(step_name: OrgSeedStepName): string {
  const display_name = step_name.replace(
    STEP_NAME_SEPARATOR,
    DISPLAY_NAME_SEPARATOR,
  );
  return `Failed to set up default ${display_name}`;
}

async function execute_seed_step(
  step: OrgSeedStep,
  organization_id: ScalarValueInput<Organization["id"]>,
): AsyncResult<number> {
  const log_context = { organization_id, step_name: step.step_name };
  console.log("[OrganizationDefaults] Seeding step", {
    event: INITIALIZATION_EVENT.ORG_SEED_STEP_STARTED,
    ...log_context,
  });
  const result = await step.seed();
  if (!result.success) {
    console.error("[OrganizationDefaults] Seeding step failed", {
      event: INITIALIZATION_EVENT.ORG_SEED_STEP_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.ORG_DEFAULTS_SEEDING_FAILED,
      ...log_context,
      error: result.error,
    });
    return create_failure_result(create_step_failure_message(step.step_name));
  }
  console.log("[OrganizationDefaults] Seeding step completed", {
    event: INITIALIZATION_EVENT.ORG_SEED_STEP_COMPLETED,
    ...log_context,
    count: result.data,
  });
  return result;
}

export function seed_default_lookup_entities_for_organization(
  organization_id: ScalarValueInput<Organization["id"]>,
): AsyncResult<OrgSeedResult> {
  return seed_default_lookup_entities_with_origin(
    organization_id,
    USER_WRITE_ORIGIN,
  );
}

export async function seed_default_lookup_entities_with_origin(
  organization_id: ScalarValueInput<Organization["id"]>,
  origin: RepositoryWriteOrigin,
): AsyncResult<OrgSeedResult> {
  console.log("[OrganizationDefaults] Starting seeding", {
    event: INITIALIZATION_EVENT.ORG_SEEDING_STARTED,
    organization_id,
  });
  const counts: Partial<Record<OrgSeedCountKey, number>> = {};
  const steps = [
    ...build_reference_data_steps(organization_id, origin),
    ...build_role_and_format_steps(organization_id, origin),
  ];
  for (const step of steps) {
    const step_result = await execute_seed_step(step, organization_id);
    if (!step_result.success) return step_result;
    counts[`${step.step_name}_seeded`] = step_result.data;
  }
  const summary = { organization_id, ...counts } as OrgSeedResult;
  console.log("[OrganizationDefaults] All steps completed", {
    event: INITIALIZATION_EVENT.ORG_SEEDING_COMPLETED,
    ...summary,
  });
  return create_success_result(summary);
}
