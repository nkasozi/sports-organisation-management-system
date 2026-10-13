import type { OrganizationSettings } from "../entities/OrganizationSettings";
import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ORGANIZATION_SETTINGS_WRITE_PERMITTED_ROLES,
  OrganizationSettingsLookupStatus,
  OrganizationSettingsUseCaseEvent,
  OrganizationSettingsUseCaseMessage,
} from "./OrganizationSettingsUseCasesConstants";
import {
  build_organization_settings_target,
  lookup_organization_settings,
} from "./OrganizationSettingsUseCasesLookup";
import {
  fail_missing_identifier,
  fail_with_message,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type OrganizationId = OrganizationSettings["organization_id"];

export function is_write_permitted(caller_role: string): boolean {
  return ORGANIZATION_SETTINGS_WRITE_PERMITTED_ROLES.some(
    (role) => role === caller_role,
  );
}

export function reject_unauthorized_write(
  event: string,
): ReturnType<typeof fail_with_message> {
  return fail_with_message(
    {
      ...build_organization_settings_target(event, {}),
      user_message: OrganizationSettingsUseCaseMessage.WRITE_NOT_PERMITTED,
    },
    UseCaseErrorCode.PERMISSION_DENIED,
  );
}

export function fail_missing_id(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    ...build_organization_settings_target(event, {}),
    user_message,
  });
}

export async function get_by_organization_id(
  repository: OrganizationSettingsRepository,
  organization_id: OrganizationId,
): AsyncResult<OrganizationSettings> {
  if (is_blank_identifier(organization_id)) {
    return fail_missing_id(
      OrganizationSettingsUseCaseEvent.GET_ID_MISSING,
      OrganizationSettingsUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    );
  }
  const lookup_result = await lookup_organization_settings(
    repository,
    organization_id,
  );
  if (!lookup_result.success) {
    return lookup_result;
  }
  const lookup = lookup_result.data;
  switch (lookup.status) {
    case OrganizationSettingsLookupStatus.FOUND:
      return create_success_result(lookup.settings);
    case OrganizationSettingsLookupStatus.MISSING:
      return fail_with_message(
        {
          ...build_organization_settings_target(
            OrganizationSettingsUseCaseEvent.GET_NOT_FOUND,
            { organization_id },
          ),
          user_message: OrganizationSettingsUseCaseMessage.NOT_FOUND,
        },
        UseCaseErrorCode.NOT_FOUND,
      );
  }
}
