import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";

import type { CompetitionResultsPageControllerCommand } from "./competitionResultsPageControllerCommand";
import { build_public_organization_scope } from "./publicDataOrganizationScope";

const COMPETITION_RESULTS_PUBLIC_DATA_PAGE = "competition_results";

export function load_competition_results_public_data(
  organization_id: string,
): Promise<{ success: boolean }> {
  return fetch_public_data_from_convex(
    COMPETITION_RESULTS_PUBLIC_DATA_PAGE,
    build_public_organization_scope(organization_id),
  );
}

export async function refresh_competition_results_public_data(
  command: CompetitionResultsPageControllerCommand,
  organization_id: string,
): Promise<boolean> {
  if (!command.get_is_public()) return false;
  const fetch_result =
    await load_competition_results_public_data(organization_id);
  command.set_is_using_cached_data(!fetch_result.success);
  return fetch_result.success;
}
