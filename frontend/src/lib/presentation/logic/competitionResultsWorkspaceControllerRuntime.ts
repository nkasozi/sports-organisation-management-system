import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import {
  download_all_fixture_reports,
  download_fixture_report,
} from "$lib/presentation/logic/competitionResultsMatchReports";
import type { CompetitionResultsSelectedCompetitionState } from "$lib/presentation/logic/competitionResultsPageContracts";
import { build_shareable_competition_results_url } from "$lib/presentation/logic/competitionResultsPageData";
import { load_team_fixtures_bundle } from "$lib/presentation/logic/competitionResultsTeamFixturesData";
import {
  competition_results_match_report_dependencies,
  competition_results_workspace_dependencies,
} from "$lib/presentation/logic/competitionResultsWorkspaceControllerDependencies";

export function create_competition_results_workspace_controller_runtime(command: {
  competitions: Competition[];
  fixtures: Fixture[];
  get_branding_logo_url: () => string;
  get_completed_fixtures: () => Fixture[];
  get_selected_competition_state: () => CompetitionResultsSelectedCompetitionState;
  get_selected_team_id: () => string;
  selected_competition_id: string;
  selected_organization_id: string;
  set_downloading_all_reports: (value: boolean) => void;
  set_downloading_fixture_id: (value: string) => void;
  set_extended_competition_map: (value: Map<string, Competition>) => void;
  set_extended_team_map: (value: Map<string, Team>) => void;
  set_selected_team_id: (value: string) => void;
  set_selected_team_name: (value: string) => void;
  set_share_link_copied: (value: boolean) => void;
  set_show_all_competitions_fixtures: (value: boolean) => void;
  set_team_fixtures_all_competitions: (value: Fixture[]) => void;
  set_team_fixtures_in_competition: (value: Fixture[]) => void;
  set_team_fixtures_loading: (value: boolean) => void;
  team_map: Map<string, Team>;
}): {
  close_team_fixtures_panel: () => void;
  handle_copy_share_link: () => boolean;
  handle_download_all_reports: () => Promise<boolean>;
  handle_download_match_report: (
    fixture: Fixture,
    event: MouseEvent,
  ) => Promise<boolean>;
  handle_team_click: (
    event: CustomEvent<{ team_id: string; team_name: string }>,
  ) => Promise<void>;
} {
  const close_team_fixtures_panel = (): void => {
    command.set_selected_team_id("");
    command.set_selected_team_name("");
    command.set_team_fixtures_in_competition([]);
    command.set_team_fixtures_all_competitions([]);
    command.set_show_all_competitions_fixtures(false);
  };
  return {
    close_team_fixtures_panel,
    handle_copy_share_link: (): boolean => {
      if (
        !command.selected_organization_id ||
        !command.selected_competition_id ||
        typeof window === "undefined"
      ) {
        return false;
      }
      navigator.clipboard.writeText(
        build_shareable_competition_results_url(
          window.location.origin,
          command.selected_organization_id,
          command.selected_competition_id,
        ),
      );
      command.set_share_link_copied(true);
      setTimeout(() => {
        command.set_share_link_copied(false);
      }, 2000);
      return true;
    },
    handle_download_all_reports: async (): Promise<boolean> => {
      command.set_downloading_all_reports(true);
      const result = await download_all_fixture_reports({
        completed_fixtures: command.get_completed_fixtures(),
        selected_competition_state: command.get_selected_competition_state(),
        team_map: command.team_map,
        organization_logo_url: command.get_branding_logo_url(),
        dependencies: competition_results_match_report_dependencies,
      });
      command.set_downloading_all_reports(false);
      return result;
    },
    handle_download_match_report: async (
      fixture: Fixture,
      event: MouseEvent,
    ): Promise<boolean> => {
      event.stopPropagation();
      command.set_downloading_fixture_id(fixture.id);
      const result = await download_fixture_report({
        fixture,
        selected_competition_state: command.get_selected_competition_state(),
        team_map: command.team_map,
        organization_logo_url: command.get_branding_logo_url(),
        dependencies: competition_results_match_report_dependencies,
      });
      command.set_downloading_fixture_id("");
      return result;
    },
    handle_team_click: async (
      event: CustomEvent<{ team_id: string; team_name: string }>,
    ): Promise<void> => {
      const selected_team_id = event.detail.team_id;
      if (command.get_selected_team_id() === selected_team_id) {
        close_team_fixtures_panel();
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
      command.set_team_fixtures_in_competition(
        bundle.team_fixtures_in_competition,
      );
      command.set_team_fixtures_all_competitions(
        bundle.team_fixtures_all_competitions,
      );
      command.set_extended_team_map(bundle.extended_team_map);
      command.set_extended_competition_map(bundle.extended_competition_map);
      command.set_team_fixtures_loading(false);
    },
  };
}
