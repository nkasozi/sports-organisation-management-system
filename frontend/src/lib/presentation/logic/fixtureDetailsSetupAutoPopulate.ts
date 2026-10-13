import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";
import type { EntityId } from "$lib/core/types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type {
  get_fixture_use_cases,
  get_game_official_role_use_cases,
  get_jersey_color_use_cases,
  get_official_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export interface FixtureDetailsSetupAutoPopulateDependencies {
  fixture_use_cases: Pick<
    ReturnType<typeof get_fixture_use_cases>,
    "get_by_id"
  >;
  jersey_color_use_cases: Pick<
    ReturnType<typeof get_jersey_color_use_cases>,
    "list" | "list_jerseys_by_entity"
  >;
  official_use_cases: Pick<ReturnType<typeof get_official_use_cases>, "list">;
  game_official_role_use_cases: Pick<
    ReturnType<typeof get_game_official_role_use_cases>,
    "list"
  >;
}

type AutoPopulateDependencies = FixtureDetailsSetupAutoPopulateDependencies;
type JerseyListResult = Awaited<
  ReturnType<AutoPopulateDependencies["jersey_color_use_cases"]["list"]>
>;
type Fixture = Extract<
  Awaited<
    ReturnType<AutoPopulateDependencies["fixture_use_cases"]["get_by_id"]>
  >,
  { success: true }
>["data"];

const COMPETITION_OFFICIAL_HOLDER_TYPE = "competition_official";
const AUTO_POPULATE_PAGINATION = { page_number: 1, page_size: 100 };

interface IdentifiedRecord {
  id: EntityId;
}

interface ListResultWithItems {
  success: boolean;
  data?: { items?: IdentifiedRecord[] };
}

function get_first_item_id(list_result: ListResultWithItems): Option<EntityId> {
  return list_result.success && list_result.data?.items?.length
    ? create_some_option(list_result.data.items[0].id)
    : create_none_option();
}

export function assign_officials_to_roles(
  officials: IdentifiedRecord[],
  roles: IdentifiedRecord[],
): OfficialAssignment[] {
  const assigned_officials: OfficialAssignment[] = [];
  const used_official_ids = new Set<string>();
  for (const role of roles) {
    const available_official = officials.find(
      (official: IdentifiedRecord) => !used_official_ids.has(official.id),
    );
    if (!available_official) continue;
    assigned_officials.push({
      official_id: available_official.id,
      role_id: role.id,
    });
    used_official_ids.add(available_official.id);
  }
  return assigned_officials;
}

async function resolve_official_jersey_id(
  competition_jerseys_result: JerseyListResult,
  dependencies: AutoPopulateDependencies,
): Promise<Option<EntityId>> {
  const competition_jersey_id = get_first_item_id(competition_jerseys_result);
  if (competition_jersey_id.status === OptionStatus.SOME)
    return competition_jersey_id;
  const all_official_jerseys_result =
    await dependencies.jersey_color_use_cases.list({
      holder_type: COMPETITION_OFFICIAL_HOLDER_TYPE,
    });
  return get_first_item_id(all_official_jerseys_result);
}

type FixtureRelatedLists = [
  Awaited<
    ReturnType<
      AutoPopulateDependencies["jersey_color_use_cases"]["list_jerseys_by_entity"]
    >
  >,
  Awaited<
    ReturnType<
      AutoPopulateDependencies["jersey_color_use_cases"]["list_jerseys_by_entity"]
    >
  >,
  JerseyListResult,
  Awaited<ReturnType<AutoPopulateDependencies["official_use_cases"]["list"]>>,
  Awaited<
    ReturnType<AutoPopulateDependencies["game_official_role_use_cases"]["list"]>
  >,
];

function load_fixture_related_lists(
  fixture: Fixture,
  dependencies: AutoPopulateDependencies,
): Promise<FixtureRelatedLists> {
  return Promise.all([
    dependencies.jersey_color_use_cases.list_jerseys_by_entity(
      "team",
      fixture.home_team_id,
    ),
    dependencies.jersey_color_use_cases.list_jerseys_by_entity(
      "team",
      fixture.away_team_id,
    ),
    dependencies.jersey_color_use_cases.list({
      holder_type: COMPETITION_OFFICIAL_HOLDER_TYPE,
      holder_id: fixture.competition_id,
    }),
    dependencies.official_use_cases.list(
      { organization_id: fixture.organization_id },
      { ...AUTO_POPULATE_PAGINATION },
    ),
    dependencies.game_official_role_use_cases.list(
      fixture.organization_id
        ? { organization_id: fixture.organization_id }
        : {},
      { ...AUTO_POPULATE_PAGINATION },
    ),
  ]);
}

function assign_if_present(
  result: Record<string, unknown>,
  field_name: string,
  value: Option<EntityId>,
): void {
  if (value.status === OptionStatus.SOME) result[field_name] = value.value;
}

export async function load_fixture_details_setup_auto_populated_data(
  fixture_id: string,
  dependencies: AutoPopulateDependencies,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { fixture_id };
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data) return result;
  const [home_jerseys, away_jerseys, official_jerseys, officials, roles] =
    await load_fixture_related_lists(fixture_result.data, dependencies);
  assign_if_present(
    result,
    "home_team_jersey_id",
    get_first_item_id(home_jerseys),
  );
  assign_if_present(
    result,
    "away_team_jersey_id",
    get_first_item_id(away_jerseys),
  );
  assign_if_present(
    result,
    "official_jersey_id",
    await resolve_official_jersey_id(official_jerseys, dependencies),
  );
  const assigned_officials = assign_officials_to_roles(
    officials.success ? officials.data.items || [] : [],
    roles.success ? roles.data.items || [] : [],
  );
  if (assigned_officials.length > 0)
    result.assigned_officials = assigned_officials;
  return result;
}
