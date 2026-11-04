import type { SharedUserRole } from "./shared_permission_definitions";

export const LINEUP_FIXTURE_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const POST_KICKOFF_LINEUP_ROLES: readonly SharedUserRole[] = [
  "super_admin",
  "org_admin",
];

export function has_post_kickoff_lineup_permission(
  role: string | undefined,
): boolean {
  return POST_KICKOFF_LINEUP_ROLES.some(
    (granted_role) => granted_role === role,
  );
}

export function can_correct_started_lineup(
  status: string | undefined,
  has_permission: boolean,
): boolean {
  return (
    has_permission &&
    (status === LINEUP_FIXTURE_STATUS.IN_PROGRESS ||
      status === LINEUP_FIXTURE_STATUS.COMPLETED)
  );
}
