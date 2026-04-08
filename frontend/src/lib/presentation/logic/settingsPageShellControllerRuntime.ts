import type { Organization } from "$lib/core/entities/Organization";
import { get_use_cases_container } from "$lib/infrastructure/container";
import { branding_store } from "$lib/presentation/stores/branding";

import { ensure_auth_profile, ensure_route_access } from "./authGuard";
import {
  apply_organization_settings_form_values,
  create_settings_form_values,
  get_default_selected_organization_id,
  type SettingsFormValues,
} from "./settingsPageState";

export function create_settings_page_shell_controller_runtime(command: {
  apply_form_values: (form_values: SettingsFormValues) => void;
  get_branding_state: () => unknown;
  get_current_form_values: () => SettingsFormValues;
  get_current_profile_organization_id: () => string | undefined;
  get_pathname: () => string;
  get_selected_organization_id: () => string;
  get_theme_state: () => unknown;
  get_organizations: () => Organization[];
  is_browser: boolean;
  set_error_message: (value: string) => void;
  set_is_loading: (value: boolean) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_organization_id: (value: string) => void;
  show_toast: (message: string, type: "success" | "error" | "info") => void;
  update_logo_url: (value: string) => void;
}): {
  handle_logo_change: (event: CustomEvent<{ url: string }>) => void;
  handle_org_switch: (org_id: string) => Promise<boolean>;
  handle_save_organization_settings: () => Promise<void>;
  handle_selected_organization_switch: () => Promise<boolean>;
  initialize_page: () => Promise<void>;
} {
  const use_cases = get_use_cases_container();
  const handle_org_switch = async (org_id: string): Promise<boolean> => {
    command.set_selected_organization_id(org_id);
    const selected_organization = command
      .get_organizations()
      .find((organization: Organization) => organization.id === org_id);
    if (!org_id) {
      command.apply_form_values(
        apply_organization_settings_form_values(
          command.get_current_form_values(),
          selected_organization,
          null,
        ),
      );
      return true;
    }
    const organization_settings_result =
      await use_cases.organization_settings_use_cases.get_by_organization_id(
        org_id,
      );
    command.apply_form_values(
      apply_organization_settings_form_values(
        command.get_current_form_values(),
        selected_organization,
        organization_settings_result.success
          ? organization_settings_result.data
          : null,
      ),
    );
    return true;
  };
  const initialize_page = async (): Promise<void> => {
    if (!command.is_browser) return;
    if (!(await ensure_route_access(command.get_pathname()))) return;
    const auth_result = await ensure_auth_profile();
    if (!auth_result.success) {
      command.set_error_message(auth_result.error_message);
      command.set_is_loading(false);
      return;
    }
    command.apply_form_values(
      create_settings_form_values(
        command.get_branding_state(),
        command.get_theme_state(),
      ),
    );
    const organizations_result = await use_cases.organization_use_cases.list(
      {},
    );
    if (
      organizations_result.success &&
      organizations_result.data?.items?.length
    ) {
      command.set_organizations(organizations_result.data.items);
      command.set_selected_organization_id(
        get_default_selected_organization_id(
          organizations_result.data.items,
          command.get_current_profile_organization_id(),
        ),
      );
      if (command.get_selected_organization_id()) {
        await handle_org_switch(command.get_selected_organization_id());
      }
    }
    command.set_is_loading(false);
  };
  const handle_selected_organization_switch = (): Promise<boolean> =>
    handle_org_switch(command.get_selected_organization_id());
  const handle_logo_change = (event: CustomEvent<{ url: string }>): void => {
    command.update_logo_url(event.detail.url);
  };
  const handle_save_organization_settings = async (): Promise<void> => {
    const current_form_values = command.get_current_form_values();
    await branding_store.set({
      organization_name: current_form_values.organization_name,
      organization_logo_url: current_form_values.organization_logo_url,
      organization_tagline: current_form_values.organization_tagline,
      organization_email: current_form_values.organization_email,
      organization_address: current_form_values.organization_address,
      social_media_links: current_form_values.social_media_links,
      header_footer_style: "pattern",
      header_pattern: current_form_values.header_pattern,
      footer_pattern: current_form_values.footer_pattern,
      background_pattern_url: current_form_values.background_pattern_url,
      show_panel_borders: current_form_values.show_panel_borders,
    });
    command.show_toast("Organization settings saved", "success");
  };
  return {
    handle_logo_change,
    handle_org_switch,
    handle_save_organization_settings,
    handle_selected_organization_switch,
    initialize_page,
  };
}
