import { ANY_VALUE } from "$lib/core/interfaces/ports";
import { load_fixture_lineup_detail_page_data } from "$lib/presentation/logic/fixtureLineupDetailPageLoad";

import type {
  FixtureLineupDetailOrganizationScopeState,
  FixtureLineupDetailPageViewData,
  FixtureLineupDetailProfileState,
} from "./fixtureLineupDetailPageContracts";

type FixtureLineupDetailPageDependencies = Parameters<
  typeof load_fixture_lineup_detail_page_data
>[0]["dependencies"];

export type FixtureLineupDetailCurrentProfile = {
  organization_id?: string;
};

type FixtureLineupDetailCurrentProfileState =
  | { status: "missing" }
  | { status: "present"; profile: FixtureLineupDetailCurrentProfile };

function resolve_fixture_lineup_detail_organization_scope_state(
  current_profile: FixtureLineupDetailCurrentProfile,
): FixtureLineupDetailOrganizationScopeState {
  if (
    !current_profile.organization_id ||
    current_profile.organization_id === ANY_VALUE
  ) {
    return { status: "unscoped" };
  }

  return {
    status: "scoped",
    organization_id: current_profile.organization_id,
  };
}

export function build_fixture_lineup_detail_profile_state(
  current_profile_state: FixtureLineupDetailCurrentProfileState,
): FixtureLineupDetailProfileState {
  if (current_profile_state.status !== "present") {
    return { status: "missing" };
  }

  return {
    status: "present",
    organization_scope_state:
      resolve_fixture_lineup_detail_organization_scope_state(
        current_profile_state.profile,
      ),
  };
}

export async function load_fixture_lineup_detail_view_data(
  lineup_id: string,
  current_profile_state: FixtureLineupDetailProfileState,
  dependencies: FixtureLineupDetailPageDependencies,
): Promise<
  | { success: true; data: FixtureLineupDetailPageViewData }
  | { success: false; error_message: string }
> {
  const result = await load_fixture_lineup_detail_page_data({
    lineup_id,
    organization_scope_state:
      current_profile_state.status === "present"
        ? current_profile_state.organization_scope_state
        : { status: "unscoped" },
    dependencies,
  });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error_message: result.error };
}
