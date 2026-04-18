import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import {
  ANY_VALUE,
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import { get_current_year_date_range } from "$lib/presentation/logic/calendarPageState";

type CalendarPageUseCases = UseCasesContainer;

export type CalendarProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export async function load_calendar_organizations(command: {
  current_profile_state: CalendarProfileState;
  organization_use_cases: UseCasesContainer["organization_use_cases"];
}): Promise<Organization[]> {
  const result = await command.organization_use_cases.list({});
  if (!result.success) return [];
  if (!result.data) return [];
  if (
    command.current_profile_state.status === "present" &&
    command.current_profile_state.profile.organization_id === ANY_VALUE
  )
    return result.data.items;

  const org_scope =
    command.current_profile_state.status === "present"
      ? get_scope_value(
          command.current_profile_state.profile,
          "organization_id",
        )
      : "";

  return org_scope
    ? result.data.items.filter((organization) => organization.id === org_scope)
    : result.data.items;
}

export async function sync_and_load_calendar_events(command: {
  organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  activity_use_cases: CalendarPageUseCases["activity_use_cases"];
}): Promise<CalendarEvent[]> {
  await command.activity_use_cases.sync_competitions_to_activities(
    command.organization_id,
  );
  await command.activity_use_cases.sync_fixtures_to_activities(
    command.organization_id,
  );
  const filter: Record<string, string> = {};
  if (command.filter_category_id)
    filter.category_id = command.filter_category_id;
  if (command.filter_competition_id)
    filter.competition_id = command.filter_competition_id;
  if (command.filter_team_id) filter.team_id = command.filter_team_id;
  const result = await command.activity_use_cases.get_calendar_events(
    command.organization_id,
    get_current_year_date_range(),
    filter,
  );
  return result.success ? result.data || [] : [];
}

export async function load_calendar_organization_bundle(command: {
  organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: CalendarPageUseCases;
}): Promise<{
  teams: Team[];
  competitions: Competition[];
  categories: ActivityCategory[];
  calendar_events: CalendarEvent[];
}> {
  const teams_result = await command.use_cases.team_use_cases.list({
    organization_id: command.organization_id,
  });
  const competitions_result =
    await command.use_cases.competition_use_cases.list({
      organization_id: command.organization_id,
    });
  await command.use_cases.activity_category_use_cases.ensure_default_categories_exist(
    command.organization_id,
  );
  const categories_result =
    await command.use_cases.activity_category_use_cases.list_by_organization(
      command.organization_id,
    );
  const calendar_events = await sync_and_load_calendar_events({
    organization_id: command.organization_id,
    filter_category_id: command.filter_category_id,
    filter_competition_id: command.filter_competition_id,
    filter_team_id: command.filter_team_id,
    activity_use_cases: command.use_cases.activity_use_cases,
  });
  return {
    teams:
      teams_result.success && teams_result.data ? teams_result.data.items : [],
    competitions:
      competitions_result.success && competitions_result.data
        ? competitions_result.data.items
        : [],
    categories:
      categories_result.success && categories_result.data
        ? categories_result.data.items
        : [],
    calendar_events,
  };
}
