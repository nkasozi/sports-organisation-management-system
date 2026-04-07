import type { Organization } from "$lib/core/entities/Organization";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { load_competition_results_organizations } from "$lib/presentation/logic/competitionResultsPageData";
import {
  type CompetitionResultsPageStateDependencies,
  type CompetitionResultsSelectedBundle,
  create_empty_competition_results_bundle,
  find_competition_results_competition,
  find_competition_results_organization,
  load_competition_results_bundle,
  load_competitions_for_results_organization,
  select_preferred_results_organization,
} from "$lib/presentation/logic/competitionResultsPageState";

export interface CompetitionResultsPageInitializationResult {
  is_using_cached_data: boolean;
  organizations: Organization[];
  selected_organization_id: string;
  competitions: CompetitionResultsSelectedCompetition[];
  selected_competition_id: string;
  bundle: CompetitionResultsSelectedBundle;
}

type CompetitionResultsSelectedCompetition =
  CompetitionResultsSelectedBundle["selected_competition"] extends
    | infer CompetitionType
    | null
    ? CompetitionType extends null
      ? never
      : CompetitionType
    : never;

export async function initialize_competition_results_page(command: {
  current_profile: UserScopeProfile | null | undefined;
  competition_results_dependencies: CompetitionResultsPageStateDependencies;
  url_params: { org_id: string; competition_id: string };
  is_public: boolean;
  saved_organization_id: string;
  sync_public_organization: (organization: Organization) => Promise<void>;
  load_public_data: () => Promise<{ success: boolean }>;
}): Promise<CompetitionResultsPageInitializationResult> {
  const fetch_result = await command.load_public_data();
  const organizations = await load_competition_results_organizations(
    command.current_profile,
    command.competition_results_dependencies.organization_use_cases,
  );
  let selected_organization_id = "";
  let competitions: CompetitionResultsSelectedCompetition[] = [];
  let selected_competition_id = "";
  let bundle = create_empty_competition_results_bundle();

  if (command.url_params.org_id.length > 0 && organizations.length > 0) {
    const matching_organization = find_competition_results_organization(
      organizations,
      command.url_params.org_id,
    );
    if (matching_organization) {
      selected_organization_id = matching_organization.id;
      await command.sync_public_organization(matching_organization);
      const organization_result =
        await load_competitions_for_results_organization(
          command.competition_results_dependencies,
          selected_organization_id,
        );
      competitions = organization_result.competitions;
      selected_competition_id = organization_result.selected_competition_id;
      bundle = organization_result.bundle;

      if (command.url_params.competition_id.length > 0) {
        const matching_competition = find_competition_results_competition(
          competitions,
          command.url_params.competition_id,
        );
        if (matching_competition) {
          selected_competition_id = matching_competition.id;
          bundle = await load_competition_results_bundle(
            command.competition_results_dependencies,
            selected_competition_id,
          );
        }
      }
    }
  }

  if (selected_organization_id.length === 0 && organizations.length > 0) {
    const preferred_organization = select_preferred_results_organization(
      organizations,
      command.saved_organization_id,
    );
    if (preferred_organization) {
      selected_organization_id = preferred_organization.id;
      const organization_result =
        await load_competitions_for_results_organization(
          command.competition_results_dependencies,
          selected_organization_id,
        );
      competitions = organization_result.competitions;
      selected_competition_id = organization_result.selected_competition_id;
      bundle = organization_result.bundle;
    }
  }

  return {
    is_using_cached_data: !fetch_result.success,
    organizations,
    selected_organization_id,
    competitions,
    selected_competition_id,
    bundle,
  };
}
