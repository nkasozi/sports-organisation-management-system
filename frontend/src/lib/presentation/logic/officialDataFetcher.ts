import { FIXTURE_STATUS } from "../../core/entities/StatusConstants";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get } from "svelte/store";
import { auth_store } from "../stores/auth";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";

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

export async function fetch_officials_from_organization(
  organization_id: string,
): Promise<BaseEntity[]> {
  return fetch_entities_for_type("official", { organization_id });
}

export async function fetch_officials_from_fixture(
  fixture_id: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  const rater_user_id = get(auth_store).current_profile?.id ?? "";
  const fixture_use_cases_result = get_use_cases_for_entity_type("fixture");
  if (!fixture_use_cases_result.success) {
    console.warn("[DataLoader] Missing fixture use cases", {
      event: "officials_from_fixture_missing_use_cases",
      fixture_id,
    });
    return [];
  }

  const [fixture_result, existing_ratings, all_org_officials] =
    await Promise.all([
      fixture_use_cases_result.data.get_by_id(fixture_id),
      fetch_entities_for_type("officialperformancerating", {
        fixture_id,
        rater_user_id,
      }),
      fetch_entities_for_type("official", { organization_id }),
    ]);

  if (!fixture_result.success || !fixture_result.data) {
    console.warn("[DataLoader] Fixture not found for official loading", {
      event: "fixture_not_found_for_officials",
      fixture_id,
    });
    return [];
  }

  const fixture = fixture_result.data as unknown as {
    assigned_officials?: Array<{ official_id: string; role_name: string }>;
  };
  const assigned_officials = fixture.assigned_officials ?? [];
  const already_rated_official_ids = new Set(
    existing_ratings.map(
      (r) => (r as unknown as { official_id: string }).official_id,
    ),
  );
  const official_map = new Map(all_org_officials.map((o) => [o.id, o]));
  const result = build_officials_with_role_labels(
    assigned_officials,
    official_map,
    already_rated_official_ids,
  );

  console.debug("[DataLoader] Loaded officials for fixture", {
    event: "officials_loaded_for_fixture",
    fixture_id,
    total_assigned: assigned_officials.length,
    already_rated: already_rated_official_ids.size,
    available_count: result.length,
  });
  return result;
}

export async function fetch_fixtures_from_official(
  official_id: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  const rater_user_id = get(auth_store).current_profile?.id ?? "";
  const [all_fixtures, fixture_setups, existing_ratings] = await Promise.all([
    fetch_entities_for_type("fixture", { organization_id }),
    fetch_entities_for_type("fixturedetailssetup", { organization_id }),
    fetch_entities_for_type("officialperformancerating", {
      official_id,
      rater_user_id,
    }),
  ]);

  const assigned_fixture_ids = new Set(
    fixture_setups
      .filter((setup) => {
        const s = setup as unknown as {
          assigned_officials: { official_id: string }[];
        };
        return s.assigned_officials?.some((a) => a.official_id === official_id);
      })
      .map((setup) => (setup as unknown as { fixture_id: string }).fixture_id),
  );
  const already_rated_fixture_ids = new Set(
    existing_ratings.map(
      (r) => (r as unknown as { fixture_id: string }).fixture_id,
    ),
  );

  console.debug("[DataLoader] Loaded fixtures for official", {
    event: "fixtures_loaded_for_official",
    official_id,
    organization_id,
    total_fixtures: all_fixtures.length,
    assigned_via_setup: assigned_fixture_ids.size,
    already_rated: already_rated_fixture_ids.size,
  });

  return all_fixtures.filter((f) => {
    const fixture = f as unknown as { status: string };
    return (
      assigned_fixture_ids.has(f.id) &&
      fixture.status === FIXTURE_STATUS.COMPLETED &&
      !already_rated_fixture_ids.has(f.id)
    );
  });
}
