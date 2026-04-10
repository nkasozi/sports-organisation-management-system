import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Team } from "$lib/core/entities/Team";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  get_competition_team_collections_after_add,
  get_competition_team_collections_after_remove,
} from "$lib/presentation/logic/competitionEditPageState";

interface CompetitionEditWorkspaceCollections {
  available_teams: Team[];
  competition_team_entries: CompetitionTeam[];
  teams_in_competition: Team[];
}

interface AddTeamToCompetitionDependency {
  add_team_to_competition(command: {
    competition_id: string;
    team_id: string;
    registration_date: string;
    seed_number: number | null;
    group_name: string | null;
    notes: string;
    status: string;
  }): Promise<{ success: boolean; data?: CompetitionTeam; error?: string }>;
}

interface RemoveTeamFromCompetitionDependency {
  remove_team_from_competition(
    competition_id: string,
    team_id: string,
  ): Promise<{ success: boolean; error?: string }>;
}

interface UpdateCompetitionDependency {
  update(
    competition_id: string,
    form_data: UpdateCompetitionInput,
  ): Promise<{ success: boolean; error?: string }>;
}

export async function submit_competition_edit_workspace(command: {
  competition_id: string;
  form_data: UpdateCompetitionInput;
  competition_use_cases: UpdateCompetitionDependency;
}): AsyncResult<boolean> {
  const result = await command.competition_use_cases.update(
    command.competition_id,
    command.form_data,
  );
  if (!result.success)
    return create_failure_result(
      result.error || "Failed to update competition",
    );
  return create_success_result(true);
}

export async function add_team_to_competition_workspace(command: {
  competition_id: string;
  team: Team;
  collections: CompetitionEditWorkspaceCollections;
  competition_team_use_cases: AddTeamToCompetitionDependency;
}): AsyncResult<CompetitionEditWorkspaceCollections> {
  const result =
    await command.competition_team_use_cases.add_team_to_competition({
      competition_id: command.competition_id,
      team_id: command.team.id,
      registration_date: new Date().toISOString().split("T")[0],
      seed_number: null,
      group_name: null,
      notes: "",
      status: "registered",
    });
  if (!result.success || !result.data)
    return create_failure_result(result.error || "Unknown error");
  return create_success_result(
    get_competition_team_collections_after_add(
      command.collections,
      result.data,
      command.team,
    ),
  );
}

export async function remove_team_from_competition_workspace(command: {
  competition_id: string;
  team: Team;
  collections: CompetitionEditWorkspaceCollections;
  competition_team_use_cases: RemoveTeamFromCompetitionDependency;
}): AsyncResult<CompetitionEditWorkspaceCollections> {
  const result =
    await command.competition_team_use_cases.remove_team_from_competition(
      command.competition_id,
      command.team.id,
    );
  if (!result.success)
    return create_failure_result(result.error || "Unknown error");
  return create_success_result(
    get_competition_team_collections_after_remove(
      command.collections,
      command.team,
    ),
  );
}
