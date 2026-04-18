import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";

export type FixtureLineupCreateOrganizationState =
  | { status: "missing" }
  | { status: "present"; organization: Organization };

export type FixtureLineupCreateFixtureState =
  | { status: "missing" }
  | { status: "present"; fixture: Fixture };

export type FixtureLineupCreateTeamState =
  | { status: "missing" }
  | { status: "present"; team: Team };

export type FixtureLineupCreateAuthProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export function create_missing_fixture_lineup_create_organization_state(): FixtureLineupCreateOrganizationState {
  return { status: "missing" };
}

function create_present_fixture_lineup_create_organization_state(
  organization: Organization,
): FixtureLineupCreateOrganizationState {
  return { status: "present", organization };
}

export function resolve_fixture_lineup_create_organization_state(
  organization_id: string,
  organizations: Organization[],
): FixtureLineupCreateOrganizationState {
  for (const organization of organizations) {
    if (organization.id === organization_id) {
      return create_present_fixture_lineup_create_organization_state(
        organization,
      );
    }
  }

  return create_missing_fixture_lineup_create_organization_state();
}

export function create_missing_fixture_lineup_create_fixture_state(): FixtureLineupCreateFixtureState {
  return { status: "missing" };
}

export function create_present_fixture_lineup_create_fixture_state(
  fixture: Fixture,
): FixtureLineupCreateFixtureState {
  return { status: "present", fixture };
}

export function create_missing_fixture_lineup_create_team_state(): FixtureLineupCreateTeamState {
  return { status: "missing" };
}

export function create_present_fixture_lineup_create_team_state(
  team: Team,
): FixtureLineupCreateTeamState {
  return { status: "present", team };
}
