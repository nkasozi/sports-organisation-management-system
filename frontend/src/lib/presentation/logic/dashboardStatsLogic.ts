import type { FixtureStatus } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { ANY_VALUE } from "$lib/core/interfaces/ports";

export interface DashboardFilters {
  organization_filter: { organization_id: string } | undefined;
  fixture_filter: { status: FixtureStatus; organization_id?: string };
  organization_count_override: number | null;
}

export function build_dashboard_filters(
  role: string,
  organization_id: string,
): DashboardFilters {
  const has_unrestricted_org_scope =
    !organization_id || organization_id === ANY_VALUE;

  if (has_unrestricted_org_scope) {
    return {
      organization_filter: undefined,
      fixture_filter: { status: FIXTURE_STATUS.SCHEDULED },
      organization_count_override: null,
    };
  }

  return {
    organization_filter: { organization_id },
    fixture_filter: { status: FIXTURE_STATUS.SCHEDULED, organization_id },
    organization_count_override: 1,
  };
}
