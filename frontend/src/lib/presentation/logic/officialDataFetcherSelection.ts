import type { BaseEntity } from "../../core/entities/BaseEntity";
import { FIXTURE_STATUS } from "../../core/entities/StatusConstants";
import { OFFICIAL_EVENT } from "./officialEventConstants";

function build_official_display_name(
  official: BaseEntity,
  role_name: string,
): string {
  const o = official as unknown as { first_name?: string; last_name?: string };
  const full_name = `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim();
  return `${full_name} - ${role_name}`;
}

function build_officials_with_role_labels(
  assigned_officials: Array<{ official_id: string; role_name: string }>,
  official_map: Map<string, BaseEntity>,
  already_rated_official_ids: Set<string>,
): BaseEntity[] {
  const result: BaseEntity[] = [];
  for (const assignment of assigned_officials) {
    if (already_rated_official_ids.has(assignment.official_id)) continue;
    const official = official_map.get(assignment.official_id);
    if (!official) continue;
    const display_name = build_official_display_name(
      official,
      assignment.role_name,
    );
    result.push({ ...official, name: display_name } as unknown as BaseEntity);
  }
  return result;
}

export function collect_rated_ids(
  existing_ratings: BaseEntity[],
  rated_id_field: "official_id" | "fixture_id",
): Set<string> {
  return new Set(
    existing_ratings.map(
      (r) => (r as unknown as Record<string, string>)[rated_id_field],
    ),
  );
}

export function collect_assigned_fixture_ids(
  fixture_setups: BaseEntity[],
  official_id: string,
): Set<string> {
  return new Set(
    fixture_setups
      .filter((setup) => {
        const s = setup as unknown as {
          assigned_officials: { official_id: string }[];
        };
        return s.assigned_officials?.some((a) => a.official_id === official_id);
      })
      .map((setup) => (setup as unknown as { fixture_id: string }).fixture_id),
  );
}

export function is_unrated_completed_assigned_fixture(
  candidate_fixture: BaseEntity,
  assigned_fixture_ids: Set<string>,
  already_rated_fixture_ids: Set<string>,
): boolean {
  const fixture = candidate_fixture as unknown as { status: string };
  return (
    assigned_fixture_ids.has(candidate_fixture.id) &&
    fixture.status === FIXTURE_STATUS.COMPLETED &&
    !already_rated_fixture_ids.has(candidate_fixture.id)
  );
}

export function build_available_fixture_officials(
  fixture_id: string,
  fixture_data: unknown,
  existing_ratings: BaseEntity[],
  all_org_officials: BaseEntity[],
): BaseEntity[] {
  const fixture = fixture_data as {
    assigned_officials?: Array<{ official_id: string; role_name: string }>;
  };
  const assigned_officials = fixture.assigned_officials ?? [];
  const already_rated_official_ids = collect_rated_ids(
    existing_ratings,
    "official_id",
  );
  const result = build_officials_with_role_labels(
    assigned_officials,
    new Map(all_org_officials.map((o) => [o.id, o])),
    already_rated_official_ids,
  );

  console.debug("[DataLoader] Loaded officials for fixture", {
    event: OFFICIAL_EVENT.OFFICIALS_LOADED,
    fixture_id,
    total_assigned: assigned_officials.length,
    already_rated: already_rated_official_ids.size,
    available_count: result.length,
  });
  return result;
}
