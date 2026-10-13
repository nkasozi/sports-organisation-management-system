import type { Sport, UpdateSportInput } from "../../core/entities/Sport";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  get_sport_by_code as repo_get_sport_by_code,
  is_sport_not_found_by_code_error,
} from "../repositories/InBrowserSportRepository";
import { build_duplicate_sport_code_message } from "./sportServiceConstants";

export async function verify_sport_code_available_for_update(
  id: ScalarValueInput<Sport["id"]>,
  requested_code: UpdateSportInput["code"],
  current_code: Sport["code"],
): Promise<Result<boolean>> {
  if (!requested_code || requested_code === current_code) {
    return create_success_result(true);
  }
  const sport_with_code_result = await repo_get_sport_by_code(requested_code);
  if (sport_with_code_result.success) {
    return sport_with_code_result.data.id === id
      ? create_success_result(true)
      : create_failure_result(
          build_duplicate_sport_code_message(requested_code),
        );
  }
  return is_sport_not_found_by_code_error(
    sport_with_code_result.error,
    requested_code,
  )
    ? create_success_result(true)
    : create_failure_result(sport_with_code_result.error);
}
