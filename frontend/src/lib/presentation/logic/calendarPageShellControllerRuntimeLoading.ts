import { get } from "svelte/store";

import {
  load_calendar_shell_bundle,
  load_calendar_shell_events,
} from "$lib/presentation/logic/calendarPageShellControllerData";
import { load_calendar_shell_initial_data } from "$lib/presentation/logic/calendarPageShellControllerInitialData";
import { is_public_viewer } from "$lib/presentation/stores/auth";
import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

import type {
  CalendarPageShellRuntimeContext,
  CalendarShellBundle,
} from "./calendarPageShellControllerRuntimeTypes";

function apply_calendar_shell_bundle(
  context: CalendarPageShellRuntimeContext,
  bundle: CalendarShellBundle,
): void {
  context.set_teams(bundle.teams);
  context.set_competitions(bundle.competitions);
  context.set_categories(bundle.categories);
  context.set_calendar_events(bundle.calendar_events);
}

function build_calendar_shell_filters(
  context: CalendarPageShellRuntimeContext,
  organization_id: string,
): {
  organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: CalendarPageShellRuntimeContext["use_cases"];
} {
  return {
    organization_id,
    filter_category_id: context.get_filter_category_id(),
    filter_competition_id: context.get_filter_competition_id(),
    filter_team_id: context.get_filter_team_id(),
    use_cases: context.use_cases,
  };
}

async function refresh_calendar_shell_bundle(
  context: CalendarPageShellRuntimeContext,
): Promise<void> {
  const selected_organization_id = context.get_selected_organization_id();
  if (!selected_organization_id) {
    return;
  }
  const bundle = await load_calendar_shell_bundle(
    build_calendar_shell_filters(context, selected_organization_id),
  );
  apply_calendar_shell_bundle(context, bundle);
}

export async function clear_calendar_shell_filters(
  context: CalendarPageShellRuntimeContext,
): Promise<void> {
  context.set_filter_category_id("");
  context.set_filter_competition_id("");
  context.set_filter_team_id("");
  await refresh_calendar_shell_bundle(context);
}

export async function handle_calendar_shell_filter_change(
  context: CalendarPageShellRuntimeContext,
): Promise<void> {
  const selected_organization_id = context.get_selected_organization_id();
  if (!selected_organization_id) {
    return;
  }
  context.set_filter_loading(true);
  context.set_calendar_events(
    await load_calendar_shell_events(
      build_calendar_shell_filters(context, selected_organization_id),
    ),
  );
  context.set_filter_loading(false);
}

export async function handle_calendar_shell_organization_change(
  context: CalendarPageShellRuntimeContext,
): Promise<void> {
  const selected_organization_id = context.get_selected_organization_id();
  if (!selected_organization_id) {
    return;
  }
  if (get(is_public_viewer) && context.get_url_org_id().length === 0) {
    await public_organization_store.set_organization(
      selected_organization_id,
      context.get_selected_organization_name(),
    );
  }
  context.set_loading_state("loading");
  await refresh_calendar_shell_bundle(context);
  context.set_loading_state("success");
}

export async function initialize_calendar_shell(
  context: CalendarPageShellRuntimeContext,
): Promise<void> {
  const initial_data = await load_calendar_shell_initial_data({
    is_public: get(is_public_viewer),
    current_profile_state: context.get_current_auth_profile_state(),
    preferred_organization_id:
      context.get_url_org_id() ||
      get(public_organization_store).organization_id,
    use_cases: context.use_cases,
  });
  if (!initial_data.success) {
    context.set_error_message(initial_data.error_message);
    context.set_loading_state("error");
    return;
  }
  context.set_loading_state("loading");
  context.set_is_using_cached_data(initial_data.is_using_cached_data);
  context.set_organizations(initial_data.organizations);
  context.set_selected_organization_id(initial_data.selected_organization_id);
  if (initial_data.bundle) {
    apply_calendar_shell_bundle(context, initial_data.bundle);
  }
  context.set_loading_state("success");
}
