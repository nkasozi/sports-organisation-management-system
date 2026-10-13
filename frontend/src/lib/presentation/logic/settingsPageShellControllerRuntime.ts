import { get_use_cases_container } from "$lib/infrastructure/container";
import { branding_store } from "$lib/presentation/stores/branding";

import {
  SETTINGS_HEADER_FOOTER_STYLE,
  SETTINGS_PAGE_MESSAGE,
} from "./settingsPageMessages";
import {
  initialize_settings_page,
  switch_settings_organization,
} from "./settingsPageShellControllerRuntimeOrganization";
import type {
  SettingsPageShellRuntime,
  SettingsPageShellRuntimeCommand,
  SettingsPageShellRuntimeContext,
} from "./settingsPageShellControllerRuntimeTypes";
import { TOAST_KIND } from "./toastConfig";

async function save_settings_organization_branding(
  context: SettingsPageShellRuntimeContext,
): Promise<void> {
  const current_form_values = context.command.get_current_form_values();
  await branding_store.set({
    organization_name: current_form_values.organization_name,
    organization_logo_url: current_form_values.organization_logo_url,
    organization_tagline: current_form_values.organization_tagline,
    organization_email: current_form_values.organization_email,
    organization_address: current_form_values.organization_address,
    social_media_links: current_form_values.social_media_links,
    header_footer_style: SETTINGS_HEADER_FOOTER_STYLE,
    header_pattern: current_form_values.header_pattern,
    footer_pattern: current_form_values.footer_pattern,
    background_pattern_url: current_form_values.background_pattern_url,
    show_panel_borders: current_form_values.show_panel_borders,
  });
  context.command.show_toast(
    SETTINGS_PAGE_MESSAGE.SAVE_SUCCEEDED,
    TOAST_KIND.SUCCESS,
  );
}

export function create_settings_page_shell_controller_runtime(
  command: SettingsPageShellRuntimeCommand,
): SettingsPageShellRuntime {
  const context: SettingsPageShellRuntimeContext = {
    command,
    use_cases: get_use_cases_container(),
  };
  return {
    handle_logo_change: (event: CustomEvent<{ url: string }>): void => {
      command.update_logo_url(event.detail.url);
    },
    handle_org_switch: (org_id: string) =>
      switch_settings_organization(context, org_id),
    handle_save_organization_settings: () =>
      save_settings_organization_branding(context),
    handle_selected_organization_switch: () =>
      switch_settings_organization(
        context,
        command.get_selected_organization_id(),
      ),
    initialize_page: () => initialize_settings_page(context),
  };
}
