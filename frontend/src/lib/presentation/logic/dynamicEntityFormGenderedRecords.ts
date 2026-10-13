import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import { PRESENCE_STATUS } from "./presenceStatus";
import { is_object_value, is_string_value } from "./runtimeTypeGuards";

const EMPTY_TEXT_VALUE = "";

export const GENDERED_RECORD_FIELD = {
  NAME: "name",
  GENDER_ID: "gender_id",
  FIRST_NAME: "first_name",
  LAST_NAME: "last_name",
} as const;

export type GenderedRecord = {
  gender: Option<string>;
  display_name: string;
};

type GenderedRecordPair =
  | {
      status: typeof PRESENCE_STATUS.PRESENT;
      first_gender_id: string;
      second_gender_id: string;
    }
  | { status: typeof PRESENCE_STATUS.MISSING };

export function read_text_field(record: unknown, field_name: string): string {
  if (!is_object_value(record)) return EMPTY_TEXT_VALUE;
  const value = (record as Record<string, unknown>)[field_name];
  return is_string_value(value) ? value : EMPTY_TEXT_VALUE;
}

function read_gender(record: unknown): Option<string> {
  const gender_id = read_text_field(record, GENDERED_RECORD_FIELD.GENDER_ID);
  return gender_id ? create_some_option(gender_id) : create_none_option();
}

export function to_gendered_player(record: unknown): GenderedRecord {
  return {
    gender: read_gender(record),
    display_name:
      `${read_text_field(record, GENDERED_RECORD_FIELD.FIRST_NAME)} ${read_text_field(record, GENDERED_RECORD_FIELD.LAST_NAME)}`.trim(),
  };
}

export function to_gendered_team(
  record: unknown,
  team_id: string,
): GenderedRecord {
  return {
    gender: read_gender(record),
    display_name:
      read_text_field(record, GENDERED_RECORD_FIELD.NAME) || team_id,
  };
}

export function pair_gender_ids(
  first: GenderedRecord,
  second: GenderedRecord,
): GenderedRecordPair {
  if (first.gender.status === OptionStatus.NONE)
    return { status: PRESENCE_STATUS.MISSING };
  if (second.gender.status === OptionStatus.NONE)
    return { status: PRESENCE_STATUS.MISSING };
  return {
    status: PRESENCE_STATUS.PRESENT,
    first_gender_id: first.gender.value,
    second_gender_id: second.gender.value,
  };
}
