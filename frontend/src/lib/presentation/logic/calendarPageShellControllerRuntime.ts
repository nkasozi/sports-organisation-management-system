import { get } from "svelte/store";

import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import {
  load_calendar_shell_bundle,
  load_calendar_shell_events,
} from "$lib/presentation/logic/calendarPageShellControllerData";
import { load_calendar_shell_initial_data } from "$lib/presentation/logic/calendarPageShellControllerInitialData";
import { type LoadingState } from "$lib/presentation/logic/calendarPageShellControllerHelpers";
import type { ActivityFormValues } from "$lib/presentation/logic/calendarPageState";
import { is_public_viewer } from "$lib/presentation/stores/auth";
import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

import { create_calendar_page_shell_controller_activity_actions } from "./calendarPageShellControllerRuntimeActivity";

export function create_calendar_page_shell_controller_runtime(command: {
  get_activity_form_values: () => ActivityFormValues;
  get_calendar_events: () => CalendarEvent[];
  get_categories: () => ActivityCategory[];
  get_current_auth_profile: () => UserScopeProfile | null;
  get_editing_activity: () => Activity | null;
  get_filter_category_id: () => string;
  get_filter_competition_id: () => string;
  get_filter_team_id: () => string;
  get_organizations: () => Organization[];
  get_selected_organization_id: () => string;
  get_selected_organization_name: () => string;
  get_url_org_id: () => string;
  set_activity_form_values: (value: ActivityFormValues) => void;
  set_calendar_events: (value: CalendarEvent[]) => void;
  set_categories: (value: ActivityCategory[]) => void;
  set_competitions: (value: Competition[]) => void;
  set_editing_activity: (value: Activity | null) => void;
  set_error_message: (value: string) => void;
  set_filter_category_id: (value: string) => void;
  set_filter_competition_id: (value: string) => void;
  set_filter_loading: (value: boolean) => void;
  set_filter_team_id: (value: string) => void;
  set_is_using_cached_data: (value: boolean) => void;
  set_loading_state: (value: LoadingState) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_event_details: (value: CalendarEvent | null) => void;
  set_selected_organization_id: (value: string) => void;
  set_show_category_modal: (value: boolean) => void;
  set_show_create_modal: (value: boolean) => void;
  set_show_subscribe_modal: (value: boolean) => void;
  set_teams: (value: Team[]) => void;
  show_toast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  use_cases: UseCasesContainer;
}) {
  const activity_actions =
    create_calendar_page_shell_controller_activity_actions(command);
  const refresh_calendar_bundle = async (): Promise<void> => {
    const selected_organization_id = command.get_selected_organization_id();
    if (!selected_organization_id) {
      return;
    }
    const bundle = await load_calendar_shell_bundle({
      organization_id: selected_organization_id,
      filter_category_id: command.get_filter_category_id(),
      filter_competition_id: command.get_filter_competition_id(),
      filter_team_id: command.get_filter_team_id(),
      use_cases: command.use_cases,
    });
    command.set_teams(bundle.teams);
    command.set_competitions(bundle.competitions);
    command.set_categories(bundle.categories);
    command.set_calendar_events(bundle.calendar_events);
  };
  return {
    clear_filters: async (): Promise<void> => {
      command.set_filter_category_id("");
      command.set_filter_competition_id("");
      command.set_filter_team_id("");
      await refresh_calendar_bundle();
    },
    handle_filter_change: async (): Promise<void> => {
      const selected_organization_id = command.get_selected_organization_id();
      if (!selected_organization_id) {
        return;
      }
      command.set_filter_loading(true);
      command.set_calendar_events(
        await load_calendar_shell_events({
          organization_id: selected_organization_id,
          filter_category_id: command.get_filter_category_id(),
          filter_competition_id: command.get_filter_competition_id(),
          filter_team_id: command.get_filter_team_id(),
          use_cases: command.use_cases,
        }),
      );
      command.set_filter_loading(false);
    },
    handle_organization_change: async (): Promise<void> => {
      const selected_organization_id = command.get_selected_organization_id();
      if (!selected_organization_id) {
        return;
      }
      if (get(is_public_viewer) && command.get_url_org_id().length === 0) {
        await public_organization_store.set_organization(
          selected_organization_id,
          command.get_selected_organization_name(),
        );
      }
      command.set_loading_state("loading");
      await refresh_calendar_bundle();
      command.set_loading_state("success");
    },
    initialize: async (): Promise<void> => {
      const initial_data = await load_calendar_shell_initial_data({
        is_public: get(is_public_viewer),
        current_profile: command.get_current_auth_profile(),
        preferred_organization_id:
          command.get_url_org_id() ||
          get(public_organization_store).organization_id,
        use_cases: command.use_cases,
      });
      if (!initial_data.success) {
        command.set_error_message(initial_data.error_message);
        command.set_loading_state("error");
        return;
      }
      command.set_loading_state("loading");
      command.set_is_using_cached_data(initial_data.is_using_cached_data);
      command.set_organizations(initial_data.organizations);
      command.set_selected_organization_id(
        initial_data.selected_organization_id,
      );
      if (initial_data.bundle) {
        command.set_teams(initial_data.bundle.teams);
        command.set_competitions(initial_data.bundle.competitions);
        command.set_categories(initial_data.bundle.categories);
        command.set_calendar_events(initial_data.bundle.calendar_events);
      }
      command.set_loading_state("success");
    },
    ...activity_actions,
  };
}
