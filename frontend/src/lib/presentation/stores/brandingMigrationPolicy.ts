import type { UserRole } from "$lib/core/interfaces/ports/external/iam/AuthenticationPort";
import { ORGANIZATION_SETTINGS_WRITE_PERMITTED_ROLES } from "$lib/core/usecases/OrganizationSettingsUseCasesConstants";

export const BRANDING_MIGRATION_DECISION = {
  MIGRATE: "migrate",
  SKIP_NOT_PERMITTED: "skip_not_permitted",
} as const;

type BrandingMigrationDecision =
  (typeof BRANDING_MIGRATION_DECISION)[keyof typeof BRANDING_MIGRATION_DECISION];

export function decide_branding_migration(
  caller_role: string,
): BrandingMigrationDecision {
  return ORGANIZATION_SETTINGS_WRITE_PERMITTED_ROLES.includes(
    caller_role as UserRole,
  )
    ? BRANDING_MIGRATION_DECISION.MIGRATE
    : BRANDING_MIGRATION_DECISION.SKIP_NOT_PERMITTED;
}

export function keep_usable_social_media_links<TLink extends { url: string }>(
  links: TLink[],
): TLink[] {
  return links.filter((link) => link.url.trim().length > 0);
}
