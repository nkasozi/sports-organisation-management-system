import { branding_store } from "$lib/presentation/stores/branding";
import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import type { UserProfile } from "$lib/presentation/stores/auth";
import { ANY_VALUE } from "$lib/core/interfaces/ports/AuthenticationPort";

export async function sync_branding_with_profile(
  profile: UserProfile | null,
): Promise<boolean> {
  if (!profile) {
    branding_store.set_organization_context(null);
    return true;
  }

  const is_super_admin = profile.role === "super_admin";
  const has_no_org_context =
    !profile.organization_id || profile.organization_id === ANY_VALUE;

  if (is_super_admin || has_no_org_context) {
    branding_store.set_organization_context(null);
    console.log(
      "[BrandingSync] Set to platform branding (super_admin or no org context)",
    );
    return true;
  }

  const org_use_cases = get_organization_use_cases();
  const org_result = await org_use_cases.get_by_id(profile.organization_id);

  if (!org_result.success || !org_result.data) {
    console.warn(
      `[BrandingSync] Could not load organization ${profile.organization_id}, using platform branding`,
    );
    branding_store.set_organization_context(null);
    return false;
  }

  const org = org_result.data;
  branding_store.set_organization_context(
    org.id,
    org.name,
    org.contact_email,
    org.address,
  );

  console.log(`[BrandingSync] Set branding for organization: ${org.name}`);
  return true;
}
