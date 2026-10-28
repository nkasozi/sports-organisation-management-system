import type { FixtureDetailsSetup } from "../entities/FixtureDetailsSetup";
import type {
  FixtureRepository,
  GameOfficialRoleRepository,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  FIXTURE_DETAILS_SETUP_EVENT,
  FIXTURE_DETAILS_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_SETUP_MESSAGE,
} from "./FixtureDetailsSetupConstants";
import { ensure_table_official_assigned } from "./FixtureTableOfficialCheck";

const UNKNOWN_ROLE_NAME = "";

export interface FixtureOfficialsSyncPort {
  sync_setup_officials(setup: FixtureDetailsSetup): AsyncResult<boolean>;
  ensure_table_official_assigned(
    assignments: ReadonlyArray<{ official_id: string; role_id: string }>,
  ): AsyncResult<boolean>;
}

type FixtureOfficialsSyncDependencies = {
  fixture_repository: Pick<FixtureRepository, "update">;
  role_repository: Pick<GameOfficialRoleRepository, "find_by_id">;
};

async function resolve_role_name(
  role_repository: FixtureOfficialsSyncDependencies["role_repository"],
  role_id: string,
): Promise<string> {
  const role_result = await role_repository.find_by_id(role_id);
  return role_result.success ? role_result.data.name : UNKNOWN_ROLE_NAME;
}

async function sync_setup_officials(
  dependencies: FixtureOfficialsSyncDependencies,
  setup: FixtureDetailsSetup,
): AsyncResult<boolean> {
  const assigned_officials = await Promise.all(
    setup.assigned_officials.map(async (assignment) => ({
      official_id: assignment.official_id,
      role_id: assignment.role_id,
      role_name: await resolve_role_name(
        dependencies.role_repository,
        assignment.role_id,
      ),
    })),
  );
  const update_result = await dependencies.fixture_repository.update(
    setup.fixture_id,
    { assigned_officials } as never,
  );
  if (update_result.success) return create_success_result(true);
  return fail_use_case({
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    log_scope: FIXTURE_DETAILS_SETUP_LOG_SCOPE,
    event: FIXTURE_DETAILS_SETUP_EVENT.FIXTURE_OFFICIALS_SYNC_FAILED,
    context: { setup_id: setup.id, fixture_id: setup.fixture_id },
    technical_detail: update_result.error,
    user_message: FIXTURE_DETAILS_SETUP_MESSAGE.FIXTURE_OFFICIALS_SYNC_FAILED,
  });
}

export function create_fixture_officials_sync(
  dependencies: FixtureOfficialsSyncDependencies,
): FixtureOfficialsSyncPort {
  return {
    sync_setup_officials: (setup: FixtureDetailsSetup) =>
      sync_setup_officials(dependencies, setup),
    ensure_table_official_assigned: (assignments) =>
      ensure_table_official_assigned(dependencies.role_repository, assignments),
  };
}
