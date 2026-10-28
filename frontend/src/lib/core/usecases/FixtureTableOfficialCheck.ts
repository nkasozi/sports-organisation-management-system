import { is_table_official_role } from "../entities/GameOfficialRoleTable";
import type { GameOfficialRoleRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { FIXTURE_DETAILS_SETUP_LOG_SCOPE } from "./FixtureDetailsSetupConstants";

const TABLE_OFFICIAL_MISSING_MESSAGE =
  "Assign a table official to this game: the person who runs the live game from the table, such as the Technical Officer. Only they, officials managers and admins can start and run the game.";
const TABLE_OFFICIAL_MISSING_EVENT =
  "fixture_details_setup_table_official_missing";

async function is_table_role(
  role_repository: Pick<GameOfficialRoleRepository, "find_by_id">,
  role_id: string,
): Promise<boolean> {
  if (!role_id) return false;
  const role_result = await role_repository.find_by_id(role_id);
  return role_result.success && is_table_official_role(role_result.data);
}

export async function ensure_table_official_assigned(
  role_repository: Pick<GameOfficialRoleRepository, "find_by_id">,
  assignments: ReadonlyArray<{ official_id: string; role_id: string }>,
): AsyncResult<boolean> {
  const filled = assignments.filter((assignment) => assignment.official_id);
  const checks = await Promise.all(
    filled.map((assignment) =>
      is_table_role(role_repository, assignment.role_id),
    ),
  );
  if (checks.some(Boolean)) return create_success_result(true);
  return fail_use_case({
    code: UseCaseErrorCode.VALIDATION_FAILED,
    log_scope: FIXTURE_DETAILS_SETUP_LOG_SCOPE,
    event: TABLE_OFFICIAL_MISSING_EVENT,
    context: { assigned_count: filled.length },
    user_message: TABLE_OFFICIAL_MISSING_MESSAGE,
  });
}
