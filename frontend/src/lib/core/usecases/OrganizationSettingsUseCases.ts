import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../entities/OrganizationSettings";
import { validate_organization_settings_input } from "../entities/OrganizationSettings";
import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { OrganizationSettingsUseCasesPort } from "../interfaces/ports/internal/usecases/OrganizationSettingsUseCasesPort";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

const WRITE_PERMITTED_ROLES = ["super_admin", "org_admin"];

function is_write_permitted(caller_role: string): boolean {
  return WRITE_PERMITTED_ROLES.includes(caller_role);
}

function reject_unauthorized_write(): AsyncResult<OrganizationSettings> {
  return Promise.resolve(
    create_failure_result(
      "Only org_admin or super_admin can modify organization settings",
    ),
  );
}

export function create_organization_settings_use_cases(
  repository: OrganizationSettingsRepository,
): OrganizationSettingsUseCasesPort {
  async function get_by_organization_id(
    organization_id: OrganizationSettings["organization_id"],
  ): AsyncResult<OrganizationSettings | null> {
    if (!organization_id || organization_id.trim().length === 0) {
      return create_failure_result("Organization ID is required");
    }
    return repository.find_by_organization_id(organization_id);
  }

  async function save_settings(
    caller_role: string,
    input: CreateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings> {
    if (!is_write_permitted(caller_role)) return reject_unauthorized_write();

    const validation_errors = validate_organization_settings_input(input);
    if (validation_errors.length > 0) {
      return create_failure_result(validation_errors.join(", "));
    }

    console.log("[OrganizationSettingsUseCases] Saving org settings", {
      event: "org_settings_save",
      organization_id: input.organization_id,
      caller_role,
    });

    return repository.create(input);
  }

  async function update_settings(
    caller_role: string,
    id: OrganizationSettings["id"],
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings> {
    if (!is_write_permitted(caller_role)) return reject_unauthorized_write();

    if (!id || id.trim().length === 0) {
      return create_failure_result("Settings ID is required");
    }

    console.log("[OrganizationSettingsUseCases] Updating org settings", {
      event: "org_settings_update",
      id,
      caller_role,
    });

    return repository.update(id, input);
  }

  async function save_or_update(
    caller_role: string,
    organization_id: OrganizationSettings["organization_id"],
    input: UpdateOrganizationSettingsInput,
  ): AsyncResult<OrganizationSettings> {
    if (!is_write_permitted(caller_role)) return reject_unauthorized_write();

    if (!organization_id || organization_id.trim().length === 0) {
      return create_failure_result("Organization ID is required");
    }

    const existing_result = await get_by_organization_id(organization_id);

    if (!existing_result.success)
      return create_failure_result(existing_result.error);

    if (existing_result.data) {
      return update_settings(caller_role, existing_result.data.id, input);
    }

    const create_input: CreateOrganizationSettingsInput = {
      organization_id,
      display_name: input.display_name ?? "",
      logo_url: input.logo_url ?? "",
      tagline: input.tagline ?? "",
      contact_email: input.contact_email ?? "",
      contact_address: input.contact_address ?? "",
      social_media_links: input.social_media_links ?? [],
      header_pattern: input.header_pattern ?? "pattern",
      footer_pattern: input.footer_pattern ?? "solid_color",
      background_pattern_url:
        input.background_pattern_url ?? "/african-mosaic-bg.svg",
      show_panel_borders: input.show_panel_borders ?? false,
      primary_color: input.primary_color ?? "red",
      secondary_color: input.secondary_color ?? "blue",
      sync_interval_ms: input.sync_interval_ms ?? 3_600_000,
    };

    return save_settings(caller_role, create_input);
  }

  return {
    get_by_organization_id,
    save_settings,
    update_settings,
    save_or_update,
  };
}
