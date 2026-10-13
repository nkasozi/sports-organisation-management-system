import type { Fixture } from "$lib/core/entities/Fixture";
import {
  download_all_fixture_reports,
  download_fixture_report,
} from "$lib/presentation/logic/competitionResultsMatchReports";
import { build_shareable_competition_results_url } from "$lib/presentation/logic/competitionResultsPageData";
import { load_team_fixtures_bundle } from "$lib/presentation/logic/competitionResultsTeamFixturesData";
import type { CompetitionResultsWorkspaceControllerCommand } from "$lib/presentation/logic/competitionResultsWorkspaceControllerCommand";
import {
  competition_results_match_report_dependencies,
  competition_results_workspace_dependencies,
} from "$lib/presentation/logic/competitionResultsWorkspaceControllerDependencies";
import { is_absent_value } from "$lib/presentation/logic/runtimeTypeGuards";

export function close_competition_results_team_fixtures_panel(
  command: CompetitionResultsWorkspaceControllerCommand,
): void {
  command.set_selected_team_id("");
  command.set_selected_team_name("");
  command.set_team_fixtures_in_competition([]);
  command.set_team_fixtures_all_competitions([]);
  command.set_show_all_competitions_fixtures(false);
}

const COMPETITION_RESULTS_SHARE_LINK_COPY_FAILED_EVENT =
  "competition_results_share_link_copy_failed";
const SHARE_LINK_COPIED_INDICATOR_MS = 2000;

function mark_share_link_copied(
  command: CompetitionResultsWorkspaceControllerCommand,
): boolean {
  command.set_share_link_copied(true);
  setTimeout(() => {
    command.set_share_link_copied(false);
  }, SHARE_LINK_COPIED_INDICATOR_MS);
  return true;
}

export function handle_competition_results_copy_share_link(
  command: CompetitionResultsWorkspaceControllerCommand,
): boolean {
  if (
    !command.selected_organization_id ||
    !command.selected_competition_id ||
    is_absent_value(window)
  ) {
    return false;
  }
  const share_url = build_shareable_competition_results_url(
    window.location.origin,
    command.selected_organization_id,
    command.selected_competition_id,
  );
  Promise.resolve(navigator.clipboard.writeText(share_url))
    .then(() => mark_share_link_copied(command))
    .catch((error: unknown) => {
      console.error("[CompetitionResults] Failed to copy share link", {
        event: COMPETITION_RESULTS_SHARE_LINK_COPY_FAILED_EVENT,
        organization_id: command.selected_organization_id,
        competition_id: command.selected_competition_id,
        error: String(error),
      });
    });
  return true;
}

export async function handle_competition_results_download_all_reports(
  command: CompetitionResultsWorkspaceControllerCommand,
): Promise<boolean> {
  command.set_downloading_all_reports(true);
  const result = await download_all_fixture_reports({
    completed_fixtures: command.get_completed_fixtures(),
    selected_competition_state: command.get_selected_competition_state(),
    sport_rules: command.get_sport_rules(),
    team_map: command.team_map,
    organization_logo_url: command.get_branding_logo_url(),
    dependencies: competition_results_match_report_dependencies,
  });
  command.set_downloading_all_reports(false);
  return result;
}

export async function handle_competition_results_download_match_report(
  command: CompetitionResultsWorkspaceControllerCommand,
  fixture: Fixture,
  event: MouseEvent,
): Promise<boolean> {
  event.stopPropagation();
  command.set_downloading_fixture_id(fixture.id);
  const result = await download_fixture_report({
    fixture,
    selected_competition_state: command.get_selected_competition_state(),
    sport_rules: command.get_sport_rules(),
    team_map: command.team_map,
    organization_logo_url: command.get_branding_logo_url(),
    dependencies: competition_results_match_report_dependencies,
  });
  command.set_downloading_fixture_id("");
  return result;
}

export async function handle_competition_results_team_click(
  command: CompetitionResultsWorkspaceControllerCommand,
  event: CustomEvent<{ team_id: string; team_name: string }>,
): Promise<void> {
  const selected_team_id = event.detail.team_id;
  if (command.get_selected_team_id() === selected_team_id) {
    close_competition_results_team_fixtures_panel(command);
    return;
  }
  command.set_selected_team_id(selected_team_id);
  command.set_selected_team_name(event.detail.team_name);
  command.set_team_fixtures_loading(true);
  const bundle = await load_team_fixtures_bundle({
    team_id: selected_team_id,
    fixtures: command.fixtures,
    team_map: command.team_map,
    competitions: command.competitions,
    dependencies: competition_results_workspace_dependencies,
  });
  command.set_team_fixtures_in_competition(bundle.team_fixtures_in_competition);
  command.set_team_fixtures_all_competitions(
    bundle.team_fixtures_all_competitions,
  );
  command.set_extended_team_map(bundle.extended_team_map);
  command.set_extended_competition_map(bundle.extended_competition_map);
  command.set_team_fixtures_loading(false);
}
