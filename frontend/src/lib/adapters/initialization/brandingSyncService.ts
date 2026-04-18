import { ANY_VALUE } from "$lib/core/interfaces/ports";
import { get_organization_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import type { UserProfile } from "$lib/presentation/stores/auth";
import { branding_store } from "$lib/presentation/stores/branding";

type BrandingSyncProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserProfile };

export async function sync_branding_with_profile(
  profile_state: BrandingSyncProfileState,
): Promise<boolean> {
  if (profile_state.status !== "present") {
    await branding_store.set_organization_context({ status: "platform" });
    return true;
  }

  const profile = profile_state.profile;

  const has_no_org_context =
    !profile.organization_id || profile.organization_id === ANY_VALUE;

  if (has_no_org_context) {
    await branding_store.set_organization_context({ status: "platform" });
    console.log(
      "[BrandingSync] Set to platform branding (unrestricted or no org context)",
    );
    return true;
  }

  const org_use_cases = get_organization_use_cases();
  const org_result = await org_use_cases.get_by_id(profile.organization_id);

  if (!org_result.success || !org_result.data) {
    console.warn(
      `[BrandingSync] Could not load organization ${profile.organization_id}, using platform branding`,
    );
    await branding_store.set_organization_context({ status: "platform" });
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

  console.log(`[BrandingSync] Set branding for organization: ${org.name}`);
  return true;
}
