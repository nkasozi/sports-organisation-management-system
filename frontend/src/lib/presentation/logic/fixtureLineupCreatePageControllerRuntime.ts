import { submit_fixture_lineup_create_form } from "./fixtureLineupCreateData";
import { initialize_fixture_lineup_create_page } from "./fixtureLineupCreatePageControllerInitialization";
import type {
  FixtureLineupCreatePageControllerRuntime,
  FixtureLineupCreatePageControllerRuntimeCommand,
} from "./fixtureLineupCreatePageControllerRuntimeTypes";
import {
  build_fixture_lineup_create_fixture_change_state,
  build_fixture_lineup_create_reference_state,
  build_fixture_lineup_create_team_change_state,
  get_fixture_lineup_create_validation_field,
} from "./fixtureLineupCreatePageControllerUpdates";
import {
  handle_fixture_lineup_create_fixture_change,
  handle_fixture_lineup_create_organization_change,
  handle_fixture_lineup_create_step_change_attempt,
  handle_fixture_lineup_create_team_change,
  reset_fixture_lineup_create_team_state,
  select_all_fixture_lineup_create_players,
  toggle_fixture_lineup_create_player,
} from "./fixtureLineupCreatePageFlow";

export function create_fixture_lineup_create_page_controller_runtime(
  command: FixtureLineupCreatePageControllerRuntimeCommand,
): FixtureLineupCreatePageControllerRuntime {
  const reset_interaction_state = (): void => {
    command.set_error_message("");
    command.set_validation_errors({});
    command.set_confirm_lock_understood(false);
    command.set_player_search_text("");
  };
  const apply_team_reset = (): void => {
    const reset_state = reset_fixture_lineup_create_team_state();
    command.set_form_data({
      ...command.get_form_data(),
      ...reset_state.form_data,
    });
    command.set_selected_team_state(reset_state.selected_team_state);
    command.set_team_players(reset_state.team_players);
    command.set_available_teams(reset_state.available_teams);
  };
  const handle_team_change = async (team_id: string): Promise<void> => {
    reset_interaction_state();
    const result = await handle_fixture_lineup_create_team_change({
      team_id,
      selected_fixture_state: command.get_selected_fixture_state(),
      current_auth_profile_state: command.get_current_auth_profile_state(),
      max_players: command.get_max_players(),
      dependencies: command.dependencies,
    });
    const next_state = build_fixture_lineup_create_team_change_state(
      result,
      command.get_form_data(),
      team_id,
    );
    command.set_selected_team_state(next_state.selected_team_state);
    command.set_team_players(next_state.team_players);
    command.set_form_data(next_state.form_data);
    command.set_validation_errors(next_state.validation_errors);
    command.set_current_step_index(2);
  };
  return {
    initialize_page: async (): Promise<void> => {
      const initialization_result = await initialize_fixture_lineup_create_page(
        {
          is_browser: command.is_browser,
          current_auth_profile_state: command.get_current_auth_profile_state(),
          form_organization_id: command.get_form_data().organization_id,
          organization_is_restricted: command.get_organization_is_restricted(),
          dependencies: command.dependencies,
        },
      );
      if (initialization_result.kind === "skip") return;
      if (initialization_result.kind === "auth-failed") {
        command.set_error_message(initialization_result.error_message);
        command.set_loading(false);
        return;
      }
      if (initialization_result.kind === "redirect") {
        await command.goto(initialization_result.redirect_to);
        return;
      }
      const reference_state = build_fixture_lineup_create_reference_state(
        initialization_result.reference_data,
      );
      command.set_fixtures(reference_state.fixtures);
      command.set_all_teams(reference_state.all_teams);
      command.set_all_competitions(reference_state.all_competitions);
      command.set_organizations(reference_state.organizations);
      command.set_selected_organization_state(
        reference_state.selected_organization_state,
      );
      command.set_error_message(reference_state.error_message);
      command.set_loading(false);
      command.set_current_step_index(initialization_result.current_step_index);
    },
    handle_organization_change: (organization_id: string): void => {
      const next_state = handle_fixture_lineup_create_organization_change({
        organization_id,
        organizations: command.get_organizations(),
      });
      command.set_form_data({
        ...command.get_form_data(),
        ...next_state.form_data,
      });
      command.set_error_message(next_state.error_message);
      command.set_validation_errors(next_state.validation_errors);
      command.set_selected_organization_state(
        next_state.selected_organization_state,
      );
      command.set_selected_fixture_state(next_state.selected_fixture_state);
      apply_team_reset();
      command.set_current_step_index(next_state.current_step_index);
    },
    handle_fixture_change: async (fixture_id: string): Promise<void> => {
      reset_interaction_state();
      const result = await handle_fixture_lineup_create_fixture_change({
        fixture_id,
        current_auth_profile_state: command.get_current_auth_profile_state(),
        organizations: command.get_organizations(),
        dependencies: command.dependencies,
        fixtures_with_complete_lineups:
          command.get_fixtures_with_complete_lineups(),
        team_players_count: command.get_team_players().length,
      });
      const next_state = build_fixture_lineup_create_fixture_change_state(
        result,
        command.get_form_data(),
      );
      command.set_error_message(next_state.error_message);
      command.set_form_data(next_state.form_data);
      command.set_selected_fixture_state(next_state.selected_fixture_state);
      command.set_selected_organization_state(
        next_state.selected_organization_state,
      );
      command.set_min_players(next_state.min_players);
      command.set_max_players(next_state.max_players);
      command.set_starters_count(next_state.starters_count);
      command.set_available_teams(next_state.available_teams);
      command.set_fixture_team_label_by_team_id(
        next_state.fixture_team_label_by_team_id,
      );
      command.set_teams_with_existing_lineups(
        next_state.teams_with_existing_lineups,
      );
      command.set_selected_team_state(next_state.selected_team_state);
      command.set_team_players(next_state.team_players);
      command.set_fixtures_with_complete_lineups(
        next_state.fixtures_with_complete_lineups,
      );
      if (result.auto_selected_team_id) {
        await handle_team_change(result.auto_selected_team_id);
        command.set_current_step_index(3);
        return;
      }
      command.set_current_step_index(result.current_step_index);
    },
    handle_team_change,
    handle_step_change_attempt: (
      from_step_index: number,
      to_step_index: number,
    ): boolean => {
      const result = handle_fixture_lineup_create_step_change_attempt({
        from_step_index,
        to_step_index,
        form_data: command.get_form_data(),
        min_players: command.get_min_players(),
        max_players: command.get_max_players(),
      });
      command.set_validation_errors(result.validation_errors);
      return result.is_allowed;
    },
    toggle_player_selection: (player_id: string): void => {
      const result = toggle_fixture_lineup_create_player({
        form_data: command.get_form_data(),
        team_players: command.get_team_players(),
        player_id,
        max_players: command.get_max_players(),
      });
      command.set_form_data({
        ...command.get_form_data(),
        selected_players: result.selected_players,
      });
      command.set_error_message(result.error_message || "");
      if (result.error_message)
        setTimeout(() => command.set_error_message(""), 3000);
    },
    select_all_players: (): void => {
      command.set_form_data({
        ...command.get_form_data(),
        selected_players: select_all_fixture_lineup_create_players({
          team_players: command.get_team_players(),
          max_players: command.get_max_players(),
        }),
      });
    },
    deselect_all_players: (): void => {
      command.set_form_data({
        ...command.get_form_data(),
        selected_players: [],
      });
    },
    handle_submit_locked_lineup: async (): Promise<void> => {
      command.set_saving(true);
      command.set_validation_errors({});
      command.set_error_message("");
      const result = await submit_fixture_lineup_create_form(
        command.get_form_data(),
        command.get_selected_organization_state(),
        command.get_selected_fixture_state(),
        command.get_selected_team_state(),
        command.get_min_players(),
        command.get_max_players(),
        command.get_confirm_lock_understood(),
        command.dependencies,
      );
      command.set_saving(false);
      if (!result.success) {
        command.set_current_step_index(result.step_index);
        if (
          result.step_index === 4 &&
          !result.error_message.includes("Confirmation required")
        ) {
          command.set_error_message(result.error_message);
          return;
        }
        command.set_validation_errors({
          [get_fixture_lineup_create_validation_field(result.step_index)]:
            result.error_message,
        });
        return;
      }
      await command.goto(`/fixture-lineups/${result.lineup_id}`);
    },
  };
}
