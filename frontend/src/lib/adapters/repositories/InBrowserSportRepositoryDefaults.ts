import type { Sport } from "../../core/entities/Sport";
import {
  create_basketball_sport_preset,
  create_field_hockey_sport_preset,
  create_football_sport_preset,
} from "../../core/entities/Sport";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../core/types/DomainScalars";

const DEFAULT_SPORT_IDS = {
  FOOTBALL: "sport-football-default",
  BASKETBALL: "sport-basketball-default",
  FIELD_HOCKEY: "sport-field-hockey-default",
};
const SPORT_NOT_FOUND_ERROR_PREFIX = "Sport not found";

export function create_sport_not_found_by_id_error(
  id: ScalarValueInput<Sport["id"]>,
): string {
  return `${SPORT_NOT_FOUND_ERROR_PREFIX}: id=${id}`;
}

export function create_sport_not_found_by_code_error(code: string): string {
  return `${SPORT_NOT_FOUND_ERROR_PREFIX}: code=${code.toLowerCase()}`;
}

export function is_sport_not_found_by_code_error(
  error: string,
  code: string,
): boolean {
  return error === create_sport_not_found_by_code_error(code);
}

export function create_default_sports(): ScalarInput<Sport>[] {
  const now = new Date().toISOString();
  return [
    {
      id: DEFAULT_SPORT_IDS.FOOTBALL,
      created_at: now,
      updated_at: now,
      ...create_football_sport_preset(),
    },
    {
      id: DEFAULT_SPORT_IDS.BASKETBALL,
      created_at: now,
      updated_at: now,
      ...create_basketball_sport_preset(),
    },
    {
      id: DEFAULT_SPORT_IDS.FIELD_HOCKEY,
      created_at: now,
      updated_at: now,
      ...create_field_hockey_sport_preset(),
    },
  ];
}
