import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Team } from "$lib/core/entities/Team";
import {
  add_team_to_competition_workspace,
  remove_team_from_competition_workspace,
  submit_competition_edit_workspace,
} from "$lib/presentation/logic/competitionEditWorkspaceActions";
import type { CompetitionEditWorkspaceControllerCommand } from "$lib/presentation/logic/competitionEditWorkspaceControllerCommand";
import { competition_edit_workspace_dependencies } from "$lib/presentation/logic/competitionEditWorkspaceControllerDependencies";

type CompetitionEditTeamWorkspaceResult = Awaited<
  ReturnType<typeof add_team_to_competition_workspace>
>;

interface CompetitionEditTeamWorkspaceMessages {
  failure_prefix: string;
  success_suffix: string;
}

function build_competition_edit_team_workspace_input(
  command: CompetitionEditWorkspaceControllerCommand,
  team: Team,
): {
  competition_id: string;
  team: Team;
  collections: {
    available_teams: Team[];
    competition_team_entries: CompetitionTeam[];
    teams_in_competition: Team[];
  };
} {
  return {
    competition_id: command.get_competition_id(),
    team,
    collections: {
      available_teams: command.get_available_teams(),
      competition_team_entries: command.get_competition_team_entries(),
      teams_in_competition: command.get_teams_in_competition(),
    },
  };
}

function apply_competition_edit_team_workspace_result(
  command: CompetitionEditWorkspaceControllerCommand,
  team: Team,
  result: CompetitionEditTeamWorkspaceResult,
  messages: CompetitionEditTeamWorkspaceMessages,
): void {
  if (!result.success) {
    command.show_toast(`${messages.failure_prefix}${result.error}`, "error");
    return;
  }
  command.set_competition_team_entries(result.data.competition_team_entries);
  command.set_teams_in_competition(result.data.teams_in_competition);
  command.set_available_teams(result.data.available_teams);
  command.show_toast(`${team.name}${messages.success_suffix}`, "success");
}

export async function handle_competition_edit_add_team(
  command: CompetitionEditWorkspaceControllerCommand,
  team: Team,
): Promise<void> {
  if (!command.get_can_edit_competition()) {
    return;
  }
  const result = await add_team_to_competition_workspace({
    ...build_competition_edit_team_workspace_input(command, team),
    competition_team_use_cases:
      competition_edit_workspace_dependencies.competition_team_use_cases,
  });
  apply_competition_edit_team_workspace_result(command, team, result, {
    failure_prefix: "Failed to add team: ",
    success_suffix: " added to competition",
  });
}

export async function handle_competition_edit_remove_team(
  command: CompetitionEditWorkspaceControllerCommand,
  team: Team,
): Promise<void> {
  if (!command.get_can_edit_competition()) {
    return;
  }
  const result = await remove_team_from_competition_workspace({
    ...build_competition_edit_team_workspace_input(command, team),
    competition_team_use_cases:
      competition_edit_workspace_dependencies.competition_team_use_cases,
  });
  apply_competition_edit_team_workspace_result(command, team, result, {
    failure_prefix: "Failed to remove team: ",
    success_suffix: " removed from competition",
  });
}

export async function handle_competition_edit_submit(
  command: CompetitionEditWorkspaceControllerCommand,
): Promise<void> {
  if (!command.get_can_edit_competition()) {
    return;
  }
  command.set_is_saving(true);
  const result = await submit_competition_edit_workspace({
    competition_id: command.get_competition_id(),
    form_data: command.get_form_data(),
    competition_use_cases:
      competition_edit_workspace_dependencies.competition_use_cases,
  });
  command.set_is_saving(false);
  if (!result.success) {
    command.show_toast(result.error, "error");
    return;
  }
  command.show_toast("Competition updated successfully!", "success");
  setTimeout(() => {
    void command.goto("/competitions");
  }, 1500);
}
