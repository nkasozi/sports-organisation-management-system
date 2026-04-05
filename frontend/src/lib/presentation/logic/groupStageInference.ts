import type { Fixture } from "$lib/core/entities/Fixture";

export function infer_group_stage_team_groups(fixtures: Fixture[]): string[][] {
  const adjacency_map = new Map<string, Set<string>>();
  const first_seen_index = new Map<string, number>();

  for (const [index, fixture] of fixtures.entries()) {
    const team_ids = [fixture.home_team_id, fixture.away_team_id].filter(
      (team_id) => team_id.trim().length > 0,
    );
    for (const team_id of team_ids) {
      if (!adjacency_map.has(team_id)) {
        adjacency_map.set(team_id, new Set());
      }
      if (!first_seen_index.has(team_id)) {
        first_seen_index.set(team_id, index);
      }
    }

    if (team_ids.length !== 2) {
      continue;
    }

    adjacency_map.get(team_ids[0])?.add(team_ids[1]);
    adjacency_map.get(team_ids[1])?.add(team_ids[0]);
  }

  const visited_team_ids = new Set<string>();
  const inferred_groups: string[][] = [];

  for (const team_id of adjacency_map.keys()) {
    if (visited_team_ids.has(team_id)) {
      continue;
    }

    const pending_team_ids = [team_id];
    const group_team_ids: string[] = [];

    while (pending_team_ids.length > 0) {
      const current_team_id = pending_team_ids.pop();
      if (!current_team_id || visited_team_ids.has(current_team_id)) {
        continue;
      }

      visited_team_ids.add(current_team_id);
      group_team_ids.push(current_team_id);

      const adjacent_team_ids = adjacency_map.get(current_team_id) ?? new Set();
      for (const adjacent_team_id of adjacent_team_ids) {
        if (!visited_team_ids.has(adjacent_team_id)) {
          pending_team_ids.push(adjacent_team_id);
        }
      }
    }

    group_team_ids.sort(
      (left, right) =>
        (first_seen_index.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (first_seen_index.get(right) ?? Number.MAX_SAFE_INTEGER),
    );
    inferred_groups.push(group_team_ids);
  }

  inferred_groups.sort(
    (left, right) =>
      (first_seen_index.get(left[0]) ?? Number.MAX_SAFE_INTEGER) -
      (first_seen_index.get(right[0]) ?? Number.MAX_SAFE_INTEGER),
  );

  return inferred_groups;
}
