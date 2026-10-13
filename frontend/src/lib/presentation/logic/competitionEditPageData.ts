import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  type CompetitionEditPageDependencies,
  type CompetitionEditPageSourceResults,
  extract_competition_edit_list_items,
  fetch_competition_edit_page_sources,
} from "./competitionEditPageDataSources";
import {
  build_competition_edit_loaded_data,
  type CompetitionEditPageLoadedData,
} from "./competitionEditPageLoadedData";

const ORGANIZATION_SPORT_UNAVAILABLE_ERROR =
  "Organization sport is unavailable";

type CompetitionEditCurrentProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export function build_competition_edit_auth_filter(
  current_profile_state: CompetitionEditCurrentProfileState,
): Record<string, string> {
  if (current_profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return {};
  }

  return build_authorization_list_filter(current_profile_state, [
    "organization_id",
  ]);
}

function get_accessible_organizations(
  all_organizations: Organization[],
  current_profile_state: CompetitionEditCurrentProfileState,
): Organization[] {
  if (current_profile_state.status !== PRESENCE_STATUS.PRESENT) return [];

  const current_profile_organization_id =
    current_profile_state.profile.organization_id;

  if (current_profile_organization_id === ANY_VALUE) return all_organizations;
  if (!current_profile_organization_id) return [];

  return all_organizations.filter(
    (organization: Organization) =>
      organization.id === current_profile_organization_id,
  );
}

export async function load_competition_edit_sport(
  organizations: Organization[],
  organization_id: string,
): Promise<Result<Sport>> {
  const selected_organization = organizations.find(
    (organization: Organization) => organization.id === organization_id,
  );

  if (!selected_organization?.sport_id)
    return create_failure_result(ORGANIZATION_SPORT_UNAVAILABLE_ERROR);

  const sport_result = await get_sport_by_id(selected_organization.sport_id);

  if (!sport_result.success) {
    return create_failure_result(
      sport_result.error || ORGANIZATION_SPORT_UNAVAILABLE_ERROR,
    );
  }

  return create_success_result(sport_result.data);
}

function resolve_loaded_competition(
  competition_result: CompetitionEditPageSourceResults["competition_result"],
):
  | { success: true; competition: Competition }
  | { success: false; error_message: string } {
  if (!competition_result.success) {
    return {
      success: false,
      error_message: competition_result.error || "Failed to load competition",
    };
  }

  if (!competition_result.data) {
    return { success: false, error_message: "Competition not found" };
  }

  return { success: true, competition: competition_result.data };
}

export async function load_competition_edit_page_data(command: {
  competition_id: string;
  current_profile_state: CompetitionEditCurrentProfileState;
  dependencies: CompetitionEditPageDependencies;
}): Promise<
  | { success: true; data: CompetitionEditPageLoadedData }
  | { success: false; error_message: string }
> {
  const { competition_id, current_profile_state, dependencies } = command;
  const sources = await fetch_competition_edit_page_sources(
    competition_id,
    build_competition_edit_auth_filter(current_profile_state),
    dependencies,
  );
  const competition_check = resolve_loaded_competition(
    sources.competition_result,
  );

  if (!competition_check.success) {
    return competition_check;
  }

  const competition = competition_check.competition;
  const organizations = get_accessible_organizations(
    extract_competition_edit_list_items(sources.organizations_result),
    current_profile_state,
  );
  const selected_sport_result = await load_competition_edit_sport(
    organizations,
    competition.organization_id,
  );

  return {
    success: true,
    data: build_competition_edit_loaded_data(
      competition,
      sources,
      organizations,
      selected_sport_result,
    ),
  };
}
