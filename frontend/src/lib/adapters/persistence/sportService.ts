import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../../core/entities/Sport";
import { validate_sport_input } from "../../core/entities/Sport";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_sport as repo_create_sport,
  delete_sport as repo_delete_sport,
  get_active_sports as repo_get_active_sports,
  get_all_sports as repo_get_all_sports,
  get_sport_by_code as repo_get_sport_by_code,
  get_sport_by_id as repo_get_sport_by_id,
  is_sport_not_found_by_code_error,
  update_sport as repo_update_sport,
} from "../repositories/InBrowserSportRepository";
import {
  get_effective_official_requirements,
  get_official_requirement_source,
} from "./sportOfficialRequirements";
import { verify_sport_code_available_for_update } from "./sportServiceCodeGuards";
import {
  build_duplicate_sport_code_message,
  SPORT_SERVICE_EVENT,
  SPORT_SERVICE_LOG_MESSAGE,
  SPORT_SERVICE_MESSAGE,
} from "./sportServiceConstants";

function is_blank(value: string): boolean {
  return !value || value.trim().length === 0;
}

function log_sport_failure<TData>(
  result: Result<TData>,
  log_message: SPORT_SERVICE_LOG_MESSAGE,
  event: SPORT_SERVICE_EVENT,
  sport_id: string,
): Result<TData> {
  if (result.success) return result;
  console.error(log_message, { event, sport_id, error: result.error });
  return result;
}

export async function get_sport_by_id(
  id: ScalarValueInput<Sport["id"]>,
): AsyncResult<Sport> {
  if (is_blank(id))
    return create_failure_result(SPORT_SERVICE_MESSAGE.SPORT_ID_REQUIRED);
  return repo_get_sport_by_id(id);
}

async function get_sport_by_code(code: string): AsyncResult<Sport> {
  if (is_blank(code))
    return create_failure_result(SPORT_SERVICE_MESSAGE.SPORT_CODE_REQUIRED);
  return repo_get_sport_by_code(code);
}

async function verify_sport_code_is_new(code: string): AsyncResult<boolean> {
  const existing_sport_result = await repo_get_sport_by_code(code);
  if (existing_sport_result.success)
    return create_failure_result(build_duplicate_sport_code_message(code));
  if (!is_sport_not_found_by_code_error(existing_sport_result.error, code))
    return existing_sport_result;
  return create_success_result(true);
}

async function create_sport(input: CreateSportInput): AsyncResult<Sport> {
  const validation_errors = validate_sport_input(input);
  if (validation_errors.length > 0)
    return create_failure_result(validation_errors.join(", "));
  const code_check = await verify_sport_code_is_new(input.code);
  if (!code_check.success) return code_check;
  return log_sport_failure(
    await repo_create_sport(input),
    SPORT_SERVICE_LOG_MESSAGE.CREATE_SPORT_FAILED,
    SPORT_SERVICE_EVENT.CREATE_SPORT_FAILED,
    input.code,
  );
}

async function update_sport(
  id: ScalarValueInput<Sport["id"]>,
  input: UpdateSportInput,
): AsyncResult<Sport> {
  const existing_sport_result = await get_sport_by_id(id);
  if (!existing_sport_result.success) return existing_sport_result;
  const code_check = await verify_sport_code_available_for_update(
    id,
    input.code,
    existing_sport_result.data.code,
  );
  if (!code_check.success) return code_check;
  return log_sport_failure(
    await repo_update_sport(id, input),
    SPORT_SERVICE_LOG_MESSAGE.UPDATE_SPORT_FAILED,
    SPORT_SERVICE_EVENT.UPDATE_SPORT_FAILED,
    id,
  );
}

async function delete_sport(
  id: ScalarValueInput<Sport["id"]>,
): AsyncResult<boolean> {
  if (is_blank(id))
    return create_failure_result(SPORT_SERVICE_MESSAGE.SPORT_ID_REQUIRED);
  return log_sport_failure(
    await repo_delete_sport(id),
    SPORT_SERVICE_LOG_MESSAGE.DELETE_SPORT_FAILED,
    SPORT_SERVICE_EVENT.DELETE_SPORT_FAILED,
    id,
  );
}

export const sportService = {
  get_all: repo_get_all_sports,
  get_by_id: get_sport_by_id,
  get_by_code: get_sport_by_code,
  create: create_sport,
  update: update_sport,
  delete: delete_sport,
  get_active: repo_get_active_sports,
  get_effective_official_requirements,
  get_official_requirement_source,
};
