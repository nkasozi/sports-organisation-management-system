import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import type { AuthProfileState } from "$lib/presentation/stores/authTypes";

import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";
import type { build_fixture_lineup_create_page_derived_state } from "./fixtureLineupCreatePageControllerDerived";
import type { FixtureLineupCreatePageControllerRuntime } from "./fixtureLineupCreatePageControllerRuntimeTypes";
import { get_player_role_label } from "./fixtureLineupCreateState";

type DerivedState = ReturnType<
  typeof build_fixture_lineup_create_page_derived_state
>;

interface FixtureLineupCreatePageViewPropsInput {
  derived_state: DerivedState;
  form_data: CreateFixtureLineupInput;
  organizations: Organization[];
  selected_organization_state: FixtureLineupCreateOrganizationState;
  selected_team_state: FixtureLineupCreateTeamState;
  fixtures_with_complete_lineups: Set<string>;
  teams_with_existing_lineups: Map<string, string>;
  available_teams: Team[];
}

interface FixtureLineupCreatePageViewHandlersInput {
  runtime: FixtureLineupCreatePageControllerRuntime;
  goto: (path: string) => Promise<unknown>;
  get_starters_count: () => number;
}

interface FixtureLineupCreatePageDerivedViewProps {
  wizard_steps: DerivedState["wizard_steps"];
  organization_select_options: DerivedState["organization_select_options"];
  organization_is_restricted: boolean;
  fixture_select_options: DerivedState["fixture_select_options"];
  fixtures_for_organization_count: number;
  all_fixtures_for_org_count: number;
  non_scheduled_fixtures_count: number;
  team_is_restricted: boolean;
  current_fixture_title: string;
  team_select_options: DerivedState["team_select_options"];
  filtered_team_players: DerivedState["filtered_team_players"];
}

interface FixtureLineupCreatePageViewProps extends FixtureLineupCreatePageDerivedViewProps {
  selected_organization_id: string;
  selected_fixture_id: string;
  selected_team_id: string;
  organizations_count: number;
  has_selected_organization: boolean;
  fixtures_with_complete_lineups_count: number;
  existing_lineup_team_names: string[];
  available_teams_count: number;
  selected_players: CreateFixtureLineupInput["selected_players"];
  selected_team_name: string;
  notes: string;
}

interface FixtureLineupCreatePageViewHandlers {
  on_validate_step_change: FixtureLineupCreatePageControllerRuntime["handle_step_change_attempt"];
  on_cancel: () => void;
  on_submit: () => Promise<void>;
  on_organization_change: (organization_id: string) => void;
  on_fixture_change: (fixture_id: string) => void;
  on_team_change: (team_id: string) => void;
  on_select_all: () => void;
  on_deselect_all: () => void;
  on_toggle_player: (player_id: string) => void;
  get_player_role_label: (player_index: number) => string;
}

const FIXTURE_LINEUP_LIST_PATH = "/fixture-lineups";

export function build_fixture_lineup_create_auth_profile_state(
  current_profile: AuthProfileState,
): FixtureLineupCreateAuthProfileState {
  return current_profile.status === PRESENCE_STATUS.PRESENT
    ? {
        status: "present",
        profile: current_profile.profile as unknown as UserScopeProfile,
      }
    : { status: "missing" };
}

export function has_authorization_defaults_changed(
  current_form_data: CreateFixtureLineupInput,
  next_form_data: CreateFixtureLineupInput,
): boolean {
  return (
    next_form_data.organization_id !== current_form_data.organization_id ||
    next_form_data.team_id !== current_form_data.team_id
  );
}

function build_derived_view_props(
  derived_state: DerivedState,
): FixtureLineupCreatePageDerivedViewProps {
  return {
    wizard_steps: derived_state.wizard_steps,
    organization_select_options: derived_state.organization_select_options,
    organization_is_restricted: derived_state.organization_is_restricted,
    fixture_select_options: derived_state.fixture_select_options,
    fixtures_for_organization_count:
      derived_state.fixtures_for_organization.length,
    all_fixtures_for_org_count: derived_state.all_fixtures_for_org.length,
    non_scheduled_fixtures_count: derived_state.non_scheduled_fixtures_count,
    team_is_restricted: derived_state.team_is_restricted,
    current_fixture_title: derived_state.current_fixture_title,
    team_select_options: derived_state.team_select_options,
    filtered_team_players: derived_state.filtered_team_players,
  };
}

export function build_fixture_lineup_create_page_view_props(
  input: FixtureLineupCreatePageViewPropsInput,
): FixtureLineupCreatePageViewProps {
  return {
    ...build_derived_view_props(input.derived_state),
    selected_organization_id: input.form_data.organization_id,
    selected_fixture_id: input.form_data.fixture_id,
    selected_team_id: input.form_data.team_id,
    organizations_count: input.organizations.length,
    has_selected_organization:
      input.selected_organization_state.status === PRESENCE_STATUS.PRESENT,
    fixtures_with_complete_lineups_count:
      input.fixtures_with_complete_lineups.size,
    existing_lineup_team_names: Array.from(
      input.teams_with_existing_lineups.values(),
    ),
    available_teams_count: input.available_teams.length,
    selected_players: input.form_data.selected_players,
    selected_team_name:
      input.selected_team_state.status === PRESENCE_STATUS.PRESENT
        ? input.selected_team_state.team.name
        : "",
    notes: input.form_data.notes || "",
  };
}

export function build_fixture_lineup_create_page_view_handlers(
  input: FixtureLineupCreatePageViewHandlersInput,
): FixtureLineupCreatePageViewHandlers {
  const runtime = input.runtime;
  return {
    on_validate_step_change: runtime.handle_step_change_attempt,
    on_cancel: (): void => void input.goto(FIXTURE_LINEUP_LIST_PATH),
    on_submit: runtime.handle_submit_locked_lineup,
    on_organization_change: runtime.handle_organization_change,
    on_fixture_change: (fixture_id: string): void =>
      void runtime.handle_fixture_change(fixture_id),
    on_team_change: (team_id: string): void =>
      void runtime.handle_team_change(team_id),
    on_select_all: runtime.select_all_players,
    on_deselect_all: runtime.deselect_all_players,
    on_toggle_player: runtime.toggle_player_selection,
    get_player_role_label: (player_index: number): string =>
      get_player_role_label(player_index, input.get_starters_count()),
  };
}
