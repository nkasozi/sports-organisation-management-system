import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";

import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";
import type {
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";

export async function submit_fixture_lineup_create_form(
  form_data: CreateFixtureLineupInput,
  selected_organization_state: FixtureLineupCreateOrganizationState,
  selected_fixture_state: FixtureLineupCreateFixtureState,
  selected_team_state: FixtureLineupCreateTeamState,
  min_players: number,
  max_players: number,
  confirm_lock_understood: boolean,
  dependencies: FixtureLineupCreateDependencies,
): Promise<
  | { success: true; lineup_id: string }
  | { success: false; error_message: string; step_index: number }
> {
  if (
    selected_organization_state.status === "missing" ||
    !form_data.organization_id
  )
    return {
      success: false,
      error_message: build_error_message(
        "Organization is required.",
        "A lineup must belong to an organization.",
        "Select an organization in Step 1.",
      ),
      step_index: 0,
    };
  if (selected_fixture_state.status === "missing" || !form_data.fixture_id)
    return {
      success: false,
      error_message: build_error_message(
        "Fixture is required.",
        "A lineup must belong to a fixture.",
        "Select a fixture in Step 2.",
      ),
      step_index: 1,
    };
  if (selected_team_state.status === "missing" || !form_data.team_id)
    return {
      success: false,
      error_message: build_error_message(
        "Team is required.",
        "A lineup must be submitted by a team participating in the fixture.",
        "Select a team in Step 3.",
      ),
      step_index: 2,
    };
  const selected_players_count = form_data.selected_players.length;
  if (
    selected_players_count < min_players ||
    selected_players_count > max_players
  )
    return {
      success: false,
      error_message: build_error_message(
        "Invalid squad size.",
        `This fixture requires between ${min_players} and ${max_players} players, but ${selected_players_count} were selected.`,
        "Adjust the selected players in Step 4, then confirm again.",
      ),
      step_index: 3,
    };
  if (!confirm_lock_understood)
    return {
      success: false,
      error_message: build_error_message(
        "Confirmation required.",
        "Submitting a lineup locks it to prevent accidental changes.",
        "Tick the confirmation checkbox in Step 5 to proceed.",
      ),
      step_index: 4,
    };
  const existing_lineup_result =
    await dependencies.lineup_use_cases.get_lineup_for_team_in_fixture(
      form_data.fixture_id,
      form_data.team_id,
    );
  if (existing_lineup_result.success)
    return {
      success: false,
      error_message: build_error_message(
        "A lineup already exists for this team in this fixture.",
        "Only one locked lineup is allowed per team per fixture.",
        "Open the existing lineup from the Fixture Lineups list.",
      ),
      step_index: 4,
    };
  const create_result = await dependencies.lineup_use_cases.create({
    ...form_data,
    status: "locked",
    submitted_at: new Date().toISOString(),
    submitted_by: form_data.submitted_by?.trim() || "system",
  });
  if (!create_result.success || !create_result.data)
    return {
      success: false,
      error_message:
        (!create_result.success ? create_result.error : void 0) ||
        build_error_message(
          "Failed to submit lineup.",
          "The lineup could not be saved.",
          "Retry. If the problem persists, reset demo data and try again.",
        ),
      step_index: 4,
    };
  return { success: true, lineup_id: create_result.data.id };
}
