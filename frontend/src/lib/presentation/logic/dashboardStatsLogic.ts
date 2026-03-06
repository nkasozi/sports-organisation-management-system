import type { FixtureStatus } from "$lib/core/entities/Fixture";

export interface DashboardFilters {
  organization_filter: { organization_id: string } | undefined;
  fixture_filter: { status: FixtureStatus; organization_id?: string };
  organization_count_override: number | null;
}

export function build_dashboard_filters(
  role: string,
  organization_id: string,
): DashboardFilters {
  const is_super_admin = role === "super_admin";

  if (is_super_admin) {
    return {
      organization_filter: undefined,
      fixture_filter: { status: "scheduled" },
      organization_count_override: null,
    };
  }

  return {
    organization_filter: { organization_id },
    fixture_filter: { status: "scheduled", organization_id },
    organization_count_override: 1,
  };
}
