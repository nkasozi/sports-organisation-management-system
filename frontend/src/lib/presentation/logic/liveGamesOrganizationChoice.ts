import type { Result } from "$lib/core/types/Result";

const ORGANIZATION_PARAMETER = "organization_id";

interface FixtureStateWithFixtures {
  fixtures: readonly unknown[];
}

export function list_live_games_organization_candidates(
  organizations: readonly { id: string }[],
  selected_organization_id: string,
  search_parameters: URLSearchParams,
): string[] {
  if (
    search_parameters.get(ORGANIZATION_PARAMETER) === selected_organization_id
  )
    return [selected_organization_id];
  return [
    selected_organization_id,
    ...organizations
      .map((organization) => organization.id)
      .filter((id) => id !== selected_organization_id),
  ];
}

export async function load_first_organization_with_fixtures<
  T extends FixtureStateWithFixtures,
>(
  candidate_ids: readonly string[],
  load: (organization_id: string) => Promise<Result<T>>,
): Promise<{ organization_id: string; result: Result<T> }> {
  const [first_id = ""] = candidate_ids;
  const first = { organization_id: first_id, result: await load(first_id) };
  if (!first.result.success || first.result.data.fixtures.length > 0)
    return first;
  for (const organization_id of candidate_ids.slice(1)) {
    const result = await load(organization_id);
    if (result.success && result.data.fixtures.length > 0)
      return { organization_id, result };
  }
  return first;
}
