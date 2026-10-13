import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY,
  type FixtureLineupCreateDependencies,
  type FixtureLineupSubmitFailureDisplay,
} from "./fixtureLineupCreateDataTypes";
import type {
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";

type SubmitFailure = {
  success: false;
  error_message: string;
  step_index: number;
  failure_display: FixtureLineupSubmitFailureDisplay;
};

interface SubmitValidationRule {
  is_violated: boolean;
  error: string;
  why: string;
  how_to_fix: string;
  step_index: number;
}

interface SubmitValidationInput {
  form_data: CreateFixtureLineupInput;
  selected_organization_state: FixtureLineupCreateOrganizationState;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  selected_team_state: FixtureLineupCreateTeamState;
  min_players: number;
  max_players: number;
  confirm_lock_understood: boolean;
}

function create_submit_failure(
  error: string,
  why: string,
  how_to_fix: string,
  step_index: number,
  failure_display: FixtureLineupSubmitFailureDisplay,
): SubmitFailure {
  return {
    success: false,
    error_message: build_error_message(error, why, how_to_fix),
    step_index,
    failure_display,
  };
}

function build_selection_validation_rules(
  input: SubmitValidationInput,
): SubmitValidationRule[] {
  return [
    {
      is_violated:
        input.selected_organization_state.status === PRESENCE_STATUS.MISSING ||
        !input.form_data.organization_id,
      error: "Organization is required.",
      why: "A lineup must belong to an organization.",
      how_to_fix: "Select an organization in Step 1.",
      step_index: 0,
    },
    {
      is_violated:
        input.selected_fixture_state.status === PRESENCE_STATUS.MISSING ||
        !input.form_data.fixture_id,
      error: "Fixture is required.",
      why: "A lineup must belong to a fixture.",
      how_to_fix: "Select a fixture in Step 2.",
      step_index: 1,
    },
    {
      is_violated:
        input.selected_team_state.status === PRESENCE_STATUS.MISSING ||
        !input.form_data.team_id,
      error: "Team is required.",
      why: "A lineup must be submitted by a team participating in the fixture.",
      how_to_fix: "Select a team in Step 3.",
      step_index: 2,
    },
  ];
}

function build_squad_validation_rules(
  input: SubmitValidationInput,
): SubmitValidationRule[] {
  const selected_players_count = input.form_data.selected_players.length;
  return [
    {
      is_violated:
        selected_players_count < input.min_players ||
        selected_players_count > input.max_players,
      error: "Invalid squad size.",
      why: `This fixture requires between ${input.min_players} and ${input.max_players} players, but ${selected_players_count} were selected.`,
      how_to_fix: "Adjust the selected players in Step 4, then confirm again.",
      step_index: 3,
    },
    {
      is_violated: !input.confirm_lock_understood,
      error: "Confirmation required.",
      why: "Submitting a lineup locks it to prevent accidental changes.",
      how_to_fix: "Tick the confirmation checkbox in Step 5 to proceed.",
      step_index: 4,
    },
  ];
}

function find_submit_validation_failure(
  input: SubmitValidationInput,
): Option<SubmitFailure> {
  const violated_rule = [
    ...build_selection_validation_rules(input),
    ...build_squad_validation_rules(input),
  ].find((rule: SubmitValidationRule) => rule.is_violated);
  if (!violated_rule) return create_none_option();
  return create_some_option(
    create_submit_failure(
      violated_rule.error,
      violated_rule.why,
      violated_rule.how_to_fix,
      violated_rule.step_index,
      FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY.FIELD_VALIDATION,
    ),
  );
}

async function create_locked_fixture_lineup(
  form_data: CreateFixtureLineupInput,
  dependencies: FixtureLineupCreateDependencies,
): Promise<{ success: true; lineup_id: string } | SubmitFailure> {
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
      failure_display: FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY.PAGE_ERROR,
    };
  return { success: true, lineup_id: create_result.data.id };
}

export async function submit_fixture_lineup_create_form(
  form_data: CreateFixtureLineupInput,
  selected_organization_state: FixtureLineupCreateOrganizationState,
  selected_fixture_state: FixtureLineupCreateFixtureState,
  selected_team_state: FixtureLineupCreateTeamState,
  min_players: number,
  max_players: number,
  confirm_lock_understood: boolean,
  dependencies: FixtureLineupCreateDependencies,
): Promise<{ success: true; lineup_id: string } | SubmitFailure> {
  const validation_failure = find_submit_validation_failure({
    form_data,
    selected_organization_state,
    selected_fixture_state,
    selected_team_state,
    min_players,
    max_players,
    confirm_lock_understood,
  });
  if (validation_failure.status === OptionStatus.SOME)
    return validation_failure.value;
  const existing_lineup_result =
    await dependencies.lineup_use_cases.get_lineup_for_team_in_fixture(
      form_data.fixture_id,
      form_data.team_id,
    );
  if (existing_lineup_result.success)
    return create_submit_failure(
      "A lineup already exists for this team in this fixture.",
      "Only one locked lineup is allowed per team per fixture.",
      "Open the existing lineup from the Fixture Lineups list.",
      4,
      FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY.PAGE_ERROR,
    );
  return create_locked_fixture_lineup(form_data, dependencies);
}
