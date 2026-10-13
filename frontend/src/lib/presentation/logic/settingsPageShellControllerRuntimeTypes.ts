import type { Organization } from "$lib/core/entities/Organization";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import type { BrandingConfig } from "$lib/presentation/stores/branding";
import type { ThemeConfig } from "$lib/presentation/stores/theme";

import type { SettingsFormValues } from "./settingsPageState";
import type { TOAST_KIND } from "./toastConfig";

export interface SettingsPageShellRuntimeCommand {
  apply_form_values: (form_values: SettingsFormValues) => void;
  get_branding_state: () => BrandingConfig;
  get_current_form_values: () => SettingsFormValues;
  get_current_profile_organization_id: () => string;
  get_pathname: () => string;
  get_selected_organization_id: () => string;
  get_theme_state: () => ThemeConfig;
  get_organizations: () => Organization[];
  is_browser: boolean;
  set_error_message: (value: string) => void;
  set_is_loading: (value: boolean) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_organization_id: (value: string) => void;
  show_toast: (
    message: string,
    type:
      | typeof TOAST_KIND.SUCCESS
      | typeof TOAST_KIND.ERROR
      | typeof TOAST_KIND.INFO,
  ) => void;
  update_logo_url: (value: string) => void;
}

export interface SettingsPageShellRuntimeContext {
  command: SettingsPageShellRuntimeCommand;
  use_cases: UseCasesContainer;
}

export interface SettingsPageShellRuntime {
  handle_logo_change: (event: CustomEvent<{ url: string }>) => void;
  handle_org_switch: (org_id: string) => Promise<boolean>;
  handle_save_organization_settings: () => Promise<void>;
  handle_selected_organization_switch: () => Promise<boolean>;
  initialize_page: () => Promise<void>;
}
