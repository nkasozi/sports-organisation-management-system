import { get } from "svelte/store";

import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { auth_store } from "$lib/presentation/stores/auth";

import { create_concept_guide_sources } from "./conceptGuideDependencies";
import { load_default_concept_snapshot } from "./conceptGuideOverview";
import type { ConceptGuideSnapshot } from "./conceptGuideTypes";

export function read_profile_organization_id(): string {
  const profile_state = get(auth_store).current_profile;
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? String(profile_state.profile.organization_id ?? "")
    : "";
}

export function load_current_user_concept_snapshot(): Promise<ConceptGuideSnapshot> {
  return load_default_concept_snapshot(
    create_concept_guide_sources(),
    read_profile_organization_id(),
  );
}
