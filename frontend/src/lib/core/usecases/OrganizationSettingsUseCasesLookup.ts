import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../entities/OrganizationSettings";
import {
  is_organization_settings_not_found_error,
  type OrganizationSettingsRepository,
} from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ORGANIZATION_SETTINGS_CREATE_DEFAULTS,
  ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE,
  OrganizationSettingsLookupStatus,
  OrganizationSettingsUseCaseEvent,
} from "./OrganizationSettingsUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import { forward_dependency_result } from "./UseCaseResultGuards";

export type OrganizationSettingsLookup =
  | {
      status: typeof OrganizationSettingsLookupStatus.FOUND;
      settings: OrganizationSettings;
    }
  | { status: typeof OrganizationSettingsLookupStatus.MISSING };

export function build_organization_settings_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return {
    log_scope: ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE,
    event,
    context,
  };
}

export async function lookup_organization_settings(
  repository: OrganizationSettingsRepository,
  organization_id: OrganizationSettings["organization_id"],
): AsyncResult<OrganizationSettingsLookup> {
  const result = await repository.find_by_organization_id(organization_id);
  if (result.success) {
    return create_success_result({
      status: OrganizationSettingsLookupStatus.FOUND,
      settings: result.data,
    });
  }
  if (is_organization_settings_not_found_error(result.error, organization_id)) {
    return create_success_result({
      status: OrganizationSettingsLookupStatus.MISSING,
    });
  }
  return forward_dependency_result(result, {
    ...build_organization_settings_target(
      OrganizationSettingsUseCaseEvent.LOOKUP_FAILED,
      { organization_id },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function build_default_create_input(
  organization_id: OrganizationSettings["organization_id"],
  input: UpdateOrganizationSettingsInput,
): CreateOrganizationSettingsInput {
  const defaults = ORGANIZATION_SETTINGS_CREATE_DEFAULTS;
  return {
    organization_id,
    display_name: input.display_name ?? defaults.display_name,
    logo_url: input.logo_url ?? defaults.logo_url,
    tagline: input.tagline ?? defaults.tagline,
    contact_email: input.contact_email ?? defaults.contact_email,
    contact_address: input.contact_address ?? defaults.contact_address,
    social_media_links: input.social_media_links ?? [
      ...defaults.social_media_links,
    ],
    header_pattern: input.header_pattern ?? defaults.header_pattern,
    footer_pattern: input.footer_pattern ?? defaults.footer_pattern,
    background_pattern_url:
      input.background_pattern_url ?? defaults.background_pattern_url,
    show_panel_borders: input.show_panel_borders ?? defaults.show_panel_borders,
    primary_color: input.primary_color ?? defaults.primary_color,
    secondary_color: input.secondary_color ?? defaults.secondary_color,
    sync_interval_ms: input.sync_interval_ms ?? defaults.sync_interval_ms,
  };
}
