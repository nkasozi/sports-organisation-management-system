import { ANY_VALUE } from "$lib/core/interfaces/ports";
import { get_organization_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import type { UserProfile } from "$lib/presentation/stores/auth";
import { branding_store } from "$lib/presentation/stores/branding";

import { BRANDING_PROFILE_STATUS } from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";

type BrandingSyncProfileState =
  | { status: typeof BRANDING_PROFILE_STATUS.MISSING }
  | { status: typeof BRANDING_PROFILE_STATUS.PRESENT; profile: UserProfile };

async function apply_platform_branding(): Promise<boolean> {
  await branding_store.set_organization_context({ status: "platform" });
  console.log("[BrandingSync] Applied platform branding", {
    event: INITIALIZATION_EVENT.BRANDING_PLATFORM_APPLIED,
  });
  return true;
}

async function apply_organization_branding(
  organization_id: string,
): Promise<boolean> {
  const org_result =
    await get_organization_use_cases().get_by_id(organization_id);
  if (!org_result.success) {
    console.warn("[BrandingSync] Organization unavailable, using platform", {
      event: INITIALIZATION_EVENT.BRANDING_ORGANIZATION_LOAD_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.BRANDING_ORGANIZATION_UNAVAILABLE,
      organization_id,
      error: org_result.error,
    });
    await apply_platform_branding();
    return false;
  }
  const org = org_result.data;
  await branding_store.set_organization_context({
    status: "scoped",
    organization_id: org.id,
    organization_name: org.name,
    organization_email: org.contact_email,
    organization_address: org.address,
  });
  console.log("[BrandingSync] Applied organization branding", {
    event: INITIALIZATION_EVENT.BRANDING_ORGANIZATION_APPLIED,
    organization_id: org.id,
  });
  return true;
}

export async function sync_branding_with_profile(
  profile_state: BrandingSyncProfileState,
): Promise<boolean> {
  switch (profile_state.status) {
    case BRANDING_PROFILE_STATUS.MISSING:
      return apply_platform_branding();
    case BRANDING_PROFILE_STATUS.PRESENT: {
      const organization_id = profile_state.profile.organization_id;
      const has_org_context =
        Boolean(organization_id) && organization_id !== ANY_VALUE;
      if (!has_org_context) return apply_platform_branding();
      return apply_organization_branding(organization_id);
    }
  }
}
