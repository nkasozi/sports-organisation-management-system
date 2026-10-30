import type { Organization } from "$lib/core/entities/Organization";
import {
  type CompetitionResultsPageStateDependencies,
  load_competitions_for_results_organization,
} from "$lib/presentation/logic/competitionResultsPageState";

import type {
  CompetitionResultsPageInitializationCommand,
  CompetitionResultsPageSelection,
} from "./competitionResultsPageInitialization";

type OrganizationDataPreparer = (organization_id: string) => Promise<boolean>;

export function read_initially_fetched_organization_id(
  command: Pick<
    CompetitionResultsPageInitializationCommand,
    "url_params" | "saved_organization_id"
  >,
): string {
  return command.url_params.org_id || command.saved_organization_id;
}

export function create_public_organization_data_preparer(
  command: CompetitionResultsPageInitializationCommand,
): OrganizationDataPreparer {
  const fetched_organization_ids = new Set([
    read_initially_fetched_organization_id(command),
  ]);
  return async (organization_id: string): Promise<boolean> => {
    if (!command.is_public || fetched_organization_ids.has(organization_id))
      return false;
    fetched_organization_ids.add(organization_id);
    return (await command.load_public_data(organization_id)).success;
  };
}

export async function load_competition_results_selection_for_organization(
  dependencies: CompetitionResultsPageStateDependencies,
  organization_id: string,
): Promise<CompetitionResultsPageSelection> {
  const organization_result = await load_competitions_for_results_organization(
    dependencies,
    organization_id,
  );
  return {
    selected_organization_id: organization_id,
    competitions: organization_result.competitions,
    selected_competition_id: organization_result.selected_competition_id,
    bundle: organization_result.bundle,
  };
}

async function load_prepared_selection(
  dependencies: CompetitionResultsPageStateDependencies,
  prepare: OrganizationDataPreparer,
  organization_id: string,
): Promise<CompetitionResultsPageSelection> {
  await prepare(organization_id);
  return load_competition_results_selection_for_organization(
    dependencies,
    organization_id,
  );
}

export async function select_first_organization_with_competitions(
  dependencies: CompetitionResultsPageStateDependencies,
  prepare: OrganizationDataPreparer,
  candidates: Organization[],
): Promise<CompetitionResultsPageSelection> {
  const [first_candidate] = candidates;
  const first_selection = await load_prepared_selection(
    dependencies,
    prepare,
    first_candidate.id,
  );
  if (first_selection.competitions.length > 0) return first_selection;
  for (const candidate of candidates.slice(1)) {
    const selection = await load_prepared_selection(
      dependencies,
      prepare,
      candidate.id,
    );
    if (selection.competitions.length > 0) return selection;
  }
  return first_selection;
}
