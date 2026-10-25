import { faker } from "@faker-js/faker";

const FAKE_COMPETITION_TEAM_COUNT = 4;
const MINIMUM_COMPETITION_TEAMS = 2;

interface FakeTeamCandidate {
  id: string;
  gender_id: string;
}

function group_by_gender(
  teams: readonly FakeTeamCandidate[],
): FakeTeamCandidate[][] {
  const groups = new Map<string, FakeTeamCandidate[]>();
  for (const team of teams)
    groups.set(team.gender_id, [...(groups.get(team.gender_id) ?? []), team]);
  return [...groups.values()].sort((a, b) => b.length - a.length);
}

export function pick_fake_competition_team_ids(
  teams: readonly FakeTeamCandidate[],
): string[] {
  const [largest = []] = group_by_gender(teams);
  if (largest.length < MINIMUM_COMPETITION_TEAMS) return [];
  return faker.helpers
    .arrayElements(
      largest,
      Math.min(FAKE_COMPETITION_TEAM_COUNT, largest.length),
    )
    .map((team) => team.id);
}
