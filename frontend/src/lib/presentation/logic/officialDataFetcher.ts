import { get } from "svelte/store";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { auth_store } from "../stores/auth";
import { normalize_auth_profile_state } from "../stores/authTypes";
import { fetch_entities_for_type } from "./dynamicFormDataLoader";
import {
  build_available_fixture_officials,
  collect_assigned_fixture_ids,
  collect_rated_ids,
  is_unrated_completed_assigned_fixture,
} from "./officialDataFetcherSelection";
import { OFFICIAL_EVENT } from "./officialEventConstants";
import { PRESENCE_STATUS } from "./presenceStatus";

function get_current_rater_user_id(): string {
  const current_profile_state = normalize_auth_profile_state(
    get(auth_store).current_profile,
  );

  return current_profile_state.status === PRESENCE_STATUS.PRESENT
    ? current_profile_state.profile.id
    : "";
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
  const fixture_use_cases_result = get_use_cases_for_entity_type("fixture");
  if (!fixture_use_cases_result.success) {
    console.warn("[DataLoader] Missing fixture use cases", {
      event: OFFICIAL_EVENT.FIXTURE_USE_CASES_MISSING,
      fixture_id,
    });
    return [];
  }

  const [fixture_result, existing_ratings, all_org_officials] =
    await Promise.all([
      fixture_use_cases_result.data.get_by_id(fixture_id),
      fetch_entities_for_type("officialperformancerating", {
        fixture_id,
        rater_user_id: get_current_rater_user_id(),
      }),
      fetch_entities_for_type("official", { organization_id }),
    ]);

  if (!fixture_result.success || !fixture_result.data) {
    console.warn("[DataLoader] Fixture not found for official loading", {
      event: OFFICIAL_EVENT.FIXTURE_NOT_FOUND,
      fixture_id,
    });
    return [];
  }

  return build_available_fixture_officials(
    fixture_id,
    fixture_result.data,
    existing_ratings,
    all_org_officials,
  );
}

export async function fetch_fixtures_from_official(
  official_id: string,
  organization_id: string,
): Promise<BaseEntity[]> {
  const rater_user_id = get_current_rater_user_id();
  const [all_fixtures, fixture_setups, existing_ratings] = await Promise.all([
    fetch_entities_for_type("fixture", { organization_id }),
    fetch_entities_for_type("fixturedetailssetup", { organization_id }),
    fetch_entities_for_type("officialperformancerating", {
      official_id,
      rater_user_id,
    }),
  ]);

  const assigned_fixture_ids = collect_assigned_fixture_ids(
    fixture_setups,
    official_id,
  );
  const already_rated_fixture_ids = collect_rated_ids(
    existing_ratings,
    "fixture_id",
  );

  console.debug("[DataLoader] Loaded fixtures for official", {
    event: OFFICIAL_EVENT.FIXTURES_LOADED,
    official_id,
    organization_id,
    total_fixtures: all_fixtures.length,
    assigned_via_setup: assigned_fixture_ids.size,
    already_rated: already_rated_fixture_ids.size,
  });

  return all_fixtures.filter((f) =>
    is_unrated_completed_assigned_fixture(
      f,
      assigned_fixture_ids,
      already_rated_fixture_ids,
    ),
  );
}
