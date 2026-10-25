import type { Competition } from "$lib/core/entities/Competition";
import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { CreateCompetitionTeamInput } from "$lib/core/entities/CompetitionTeam";
import { create_competition_team_inputs } from "$lib/presentation/logic/competitionCreatePageState";
import {
  assign_default_official_jersey,
  type DefaultOfficialJerseyUseCases,
} from "$lib/presentation/logic/competitionDefaultOfficialJersey";

const COMPETITION_CREATE_SUBMIT_TEXT = {
  create_failed: "Failed to create competition",
  partial_team_registration:
    "Competition created but failed to register some teams. Please add teams manually.",
} as const;

type EntityResult<EntityType> = {
  success: boolean;
  data?: EntityType;
  error?: string;
};

interface CompetitionCreateSubmitDependencies {
  competition_team_use_cases: {
    create: (
      input: CreateCompetitionTeamInput,
    ) => Promise<EntityResult<CompetitionTeam>>;
  };
  competition_use_cases: {
    create: (
      input: CreateCompetitionInput,
    ) => Promise<EntityResult<Competition>>;
  };
  jersey_color_use_cases: DefaultOfficialJerseyUseCases;
}

async function register_competition_teams(
  command: {
    dependencies: CompetitionCreateSubmitDependencies;
    form_data: CreateCompetitionInput;
  },
  competition_id: string,
): Promise<boolean> {
  const registration_date = new Date().toISOString().split("T")[0];
  for (const competition_team_input of create_competition_team_inputs(
    competition_id,
    command.form_data.team_ids,
    registration_date,
  )) {
    const competition_team_result =
      await command.dependencies.competition_team_use_cases.create(
        competition_team_input,
      );
    if (!competition_team_result.success) {
      return false;
    }
  }

  return true;
}

export async function submit_competition_create_form(command: {
  dependencies: CompetitionCreateSubmitDependencies;
  form_data: CreateCompetitionInput;
}): Promise<{
  error_message: string;
  success: boolean;
}> {
  const competition_result =
    await command.dependencies.competition_use_cases.create(command.form_data);
  if (!competition_result.success || !competition_result.data) {
    return {
      success: false,
      error_message:
        competition_result.error ||
        COMPETITION_CREATE_SUBMIT_TEXT.create_failed,
    };
  }

  await assign_default_official_jersey(
    competition_result.data.id,
    command.dependencies.jersey_color_use_cases,
  );
  const teams_registered = await register_competition_teams(
    command,
    competition_result.data.id,
  );
  if (!teams_registered) {
    return {
      success: false,
      error_message: COMPETITION_CREATE_SUBMIT_TEXT.partial_team_registration,
    };
  }

  return {
    success: true,
    error_message: "",
  };
}
