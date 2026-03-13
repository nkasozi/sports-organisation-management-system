import type { Fixture } from "../entities/Fixture";
import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
  OfficialAssignment,
} from "../entities/FixtureDetailsSetup";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { JerseyColorUseCases } from "../usecases/JerseyColorUseCases";
import type { OfficialUseCases } from "../usecases/OfficialUseCases";
import type { GameOfficialRoleUseCases } from "../usecases/GameOfficialRoleUseCases";
import type { Result } from "../types/Result";

export interface AutoSetupDependencies {
  fixture_details_setup_use_cases: FixtureDetailsSetupUseCases;
  jersey_color_use_cases: JerseyColorUseCases;
  official_use_cases: OfficialUseCases;
  game_official_role_use_cases: GameOfficialRoleUseCases;
}

export async function auto_create_fixture_details_setup(
  fixture: Fixture,
  dependencies: AutoSetupDependencies,
): Promise<Result<FixtureDetailsSetup>> {
  console.log(
    "[DEBUG fixtureDetailsAutoSetup] Starting auto-create for fixture:",
    fixture.id,
  );

  const populated_data_result = await build_auto_populated_input(
    fixture,
    dependencies,
  );

  if (!populated_data_result.success) {
    return { success: false, error: populated_data_result.error };
  }

  console.log(
    "[DEBUG fixtureDetailsAutoSetup] Auto-populated data built, creating fixture details setup",
  );

  const create_result =
    await dependencies.fixture_details_setup_use_cases.create(
      populated_data_result.data,
    );

  if (!create_result.success) {
    console.log(
      "[DEBUG fixtureDetailsAutoSetup] Failed to create fixture details setup:",
      create_result.error,
    );
    return create_result;
  }

  console.log(
    "[DEBUG fixtureDetailsAutoSetup] Successfully created fixture details setup:",
    create_result.data.id,
  );

  return create_result;
}

async function build_auto_populated_input(
  fixture: Fixture,
  dependencies: AutoSetupDependencies,
): Promise<Result<CreateFixtureDetailsSetupInput>> {
  const {
    jersey_color_use_cases,
    official_use_cases,
    game_official_role_use_cases,
  } = dependencies;

  const [
    home_jerseys_result,
    away_jerseys_result,
    official_jerseys_result,
    officials_result,
    roles_result,
  ] = await Promise.all([
    jersey_color_use_cases.list_jerseys_by_entity("team", fixture.home_team_id),
    jersey_color_use_cases.list_jerseys_by_entity("team", fixture.away_team_id),
    jersey_color_use_cases.list_jerseys_by_entity(
      "competition_official",
      fixture.competition_id,
    ),
    official_use_cases.list(
      { organization_id: fixture.organization_id },
      { page_number: 1, page_size: 100 },
    ),
    game_official_role_use_cases.list({}, { page_number: 1, page_size: 100 }),
  ]);

  const errors: string[] = [];
  const home_team_jersey_id = extract_first_jersey_id(home_jerseys_result);
  if (!home_team_jersey_id) {
    errors.push(`No Jerseys found for Home Team (${fixture.home_team_id})`);
  }
  const away_team_jersey_id = extract_first_jersey_id(away_jerseys_result);
  if (!away_team_jersey_id) {
    errors.push(`No Jerseys found for Away Team (${fixture.away_team_id})`);
  }
  const official_jersey_id = extract_first_jersey_id(official_jerseys_result);
  if (!official_jersey_id) {
    errors.push(
      `No Jerseys found for Officials (competition ${fixture.competition_id})`,
    );
  }

  const assigned_officials = build_official_assignments(
    officials_result,
    roles_result,
  );
  if (
    roles_result.success &&
    (roles_result.data?.items?.length ?? 0) > 0 &&
    (!officials_result.success || !officials_result.data?.items?.length)
  ) {
    errors.push(
      `No Officials found for Organization (${fixture.organization_id})`,
    );
  }
  if (
    officials_result.success &&
    (officials_result.data?.items?.length ?? 0) > 0 &&
    (!roles_result.success || !roles_result.data?.items?.length)
  ) {
    errors.push(
      `No Official Roles found for Competition (${fixture.competition_id})`,
    );
  }
  if (errors.length > 0) {
    return { success: false, error: errors.join(", ") };
  }

  return {
    success: true,
    data: {
      organization_id: fixture.organization_id,
      fixture_id: fixture.id,
      home_team_jersey_id: home_team_jersey_id!,
      away_team_jersey_id: away_team_jersey_id!,
      official_jersey_id: official_jersey_id!,
      assigned_officials,
      assignment_notes: "",
      confirmation_status: "confirmed",
      status: "active",
    },
  };
}

function extract_first_jersey_id(result: {
  success: boolean;
  data?: { items?: { id: string }[] };
}): string | null {
  if (!result.success) return null;
  if (!result.data?.items?.length) return null;
  return result.data.items[0].id;
}

function build_official_assignments(
  officials_result: { success: boolean; data?: { items?: { id: string }[] } },
  roles_result: { success: boolean; data?: { items?: { id: string }[] } },
): OfficialAssignment[] {
  const officials = officials_result.success
    ? officials_result.data?.items || []
    : [];
  const roles = roles_result.success ? roles_result.data?.items || [] : [];

  if (officials.length === 0 || roles.length === 0) return [];

  const assigned_officials: OfficialAssignment[] = [];
  const used_official_ids = new Set<string>();

  for (const role of roles) {
    const available_official = officials.find(
      (o) => !used_official_ids.has(o.id),
    );
    if (!available_official) break;

    assigned_officials.push({
      official_id: available_official.id,
      role_id: role.id,
    });
    used_official_ids.add(available_official.id);
  }

  return assigned_officials;
}
