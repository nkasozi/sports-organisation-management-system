import type { Organization } from "$lib/core/entities/Organization";

import { ensure_auth_profile, ensure_route_access } from "./authGuard";
import { PRESENCE_STATUS } from "./presenceStatus";
import {
  apply_settings_page_load_state,
  mark_settings_page_failed,
  mark_settings_page_ready,
} from "./settingsPageLoadState";
import {
  SETTINGS_PAGE_EVENT,
  SETTINGS_PAGE_MESSAGE,
} from "./settingsPageMessages";
import type { SettingsPageShellRuntimeContext } from "./settingsPageShellControllerRuntimeTypes";
import {
  apply_organization_settings_form_values,
  create_settings_form_values,
  get_default_selected_organization_id,
} from "./settingsPageState";
import { TOAST_KIND } from "./toastConfig";

type SettingsSelectedOrganizationState =
  | { status: typeof PRESENCE_STATUS.PRESENT; organization: Organization }
  | { status: typeof PRESENCE_STATUS.MISSING };

function resolve_settings_selected_organization_state(
  organizations: Organization[],
  org_id: string,
): SettingsSelectedOrganizationState {
  const selected_organization = organizations.find(
    (organization: Organization) => organization.id === org_id,
  );
  return selected_organization
    ? { status: PRESENCE_STATUS.PRESENT, organization: selected_organization }
    : { status: PRESENCE_STATUS.MISSING };
}

type SettingsOrganizationSettingsState = Parameters<
  typeof apply_organization_settings_form_values
>[2];

async function load_settings_organization_settings_state(
  context: SettingsPageShellRuntimeContext,
  org_id: string,
): Promise<SettingsOrganizationSettingsState> {
  if (!org_id) return { status: PRESENCE_STATUS.MISSING };
  const organization_settings_result =
    await context.use_cases.organization_settings_use_cases.get_by_organization_id(
      org_id,
    );
  if (organization_settings_result.success)
    return {
      status: PRESENCE_STATUS.PRESENT,
      organization_settings: organization_settings_result.data,
    };
  console.warn("[Settings] Organization settings unavailable", {
    event: SETTINGS_PAGE_EVENT.ORGANIZATION_SETTINGS_UNAVAILABLE,
    organization_id: org_id,
    error: organization_settings_result.error,
  });
  return { status: PRESENCE_STATUS.MISSING };
}

export async function switch_settings_organization(
  context: SettingsPageShellRuntimeContext,
  org_id: string,
): Promise<boolean> {
  const { command } = context;
  command.set_selected_organization_id(org_id);
  const selected_organization_state =
    resolve_settings_selected_organization_state(
      command.get_organizations(),
      org_id,
    );
  const organization_settings_state =
    await load_settings_organization_settings_state(context, org_id);
  command.apply_form_values(
    apply_organization_settings_form_values(
      command.get_current_form_values(),
      selected_organization_state,
      organization_settings_state,
    ),
  );
  return true;
}

async function load_settings_organizations(
  context: SettingsPageShellRuntimeContext,
): Promise<void> {
  const { command, use_cases } = context;
  const organizations_result = await use_cases.organization_use_cases.list({});
  if (!organizations_result.success) {
    console.error("[Settings] Organizations load failed", {
      event: SETTINGS_PAGE_EVENT.ORGANIZATIONS_LOAD_FAILED,
      error: organizations_result.error,
    });
    command.show_toast(
      SETTINGS_PAGE_MESSAGE.ORGANIZATIONS_LOAD_FAILED,
      TOAST_KIND.ERROR,
    );
    return;
  }
  if (!organizations_result.data?.items?.length) return;
  command.set_organizations(organizations_result.data.items);
  command.set_selected_organization_id(
    get_default_selected_organization_id(
      organizations_result.data.items,
      command.get_current_profile_organization_id(),
    ),
  );
  if (command.get_selected_organization_id()) {
    await switch_settings_organization(
      context,
      command.get_selected_organization_id(),
    );
  }
}

export async function initialize_settings_page(
  context: SettingsPageShellRuntimeContext,
): Promise<void> {
  const { command } = context;
  if (!command.is_browser) return;
  if (!(await ensure_route_access(command.get_pathname()))) return;
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    apply_settings_page_load_state(
      command,
      mark_settings_page_failed(auth_result.error_message),
    );
    return;
  }
  command.apply_form_values(
    create_settings_form_values(
      command.get_branding_state(),
      command.get_theme_state(),
    ),
  );
  await load_settings_organizations(context);
  apply_settings_page_load_state(command, mark_settings_page_ready());
}
