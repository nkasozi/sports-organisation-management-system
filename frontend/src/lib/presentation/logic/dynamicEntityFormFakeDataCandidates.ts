import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../../core/types/Option";
import { is_string_value } from "./runtimeTypeGuards";

const EMPTY_FIELD_VALUE = "";
const GENDER_FIELD_NAME = "gender_id";

export interface ForeignKeyCandidateState {
  form_data: Record<string, unknown>;
  foreign_key_options?: Record<string, BaseEntity[]>;
}

function read_text(record: object, key: string): string {
  const value = (record as Record<string, unknown>)[key];
  return is_string_value(value) ? value : EMPTY_FIELD_VALUE;
}

export function find_selected_option_entity(
  state: ForeignKeyCandidateState,
  field_name: string,
): Option<BaseEntity> {
  const selected_id = read_text(state.form_data, field_name);
  if (selected_id === EMPTY_FIELD_VALUE) return create_none_option();
  const entity = (state.foreign_key_options?.[field_name] ?? []).find(
    (option) => String(option.id) === selected_id,
  );
  return entity ? create_some_option(entity) : create_none_option();
}

function exclude_paired_value(
  field: FieldMetadata,
  state: ForeignKeyCandidateState,
  options: BaseEntity[],
): BaseEntity[] {
  const paired_field = field.foreign_key_filter?.exclude_field ?? "";
  const paired_value = read_text(state.form_data, paired_field);
  if (paired_value === EMPTY_FIELD_VALUE) return options;
  return options.filter((option) => String(option.id) !== paired_value);
}

function selected_gender_ids(
  field: FieldMetadata,
  fields: FieldMetadata[],
  state: ForeignKeyCandidateState,
): Set<string> {
  const gender_ids = fields
    .filter((other) => other.field_name !== field.field_name)
    .map((other) => find_selected_option_entity(state, other.field_name))
    .map((selected) =>
      selected.status === OptionStatus.SOME
        ? read_text(selected.value, GENDER_FIELD_NAME)
        : EMPTY_FIELD_VALUE,
    )
    .filter((gender_id) => gender_id !== EMPTY_FIELD_VALUE);
  return new Set(gender_ids);
}

function prefer_matching_gender(
  gender_ids: Set<string>,
  options: BaseEntity[],
): BaseEntity[] {
  if (gender_ids.size === 0) return options;
  const matching = options.filter((option) =>
    gender_ids.has(read_text(option, GENDER_FIELD_NAME)),
  );
  return matching.length > 0 ? matching : options;
}

export function list_foreign_key_candidates(
  field: FieldMetadata,
  fields: FieldMetadata[],
  state: ForeignKeyCandidateState,
): BaseEntity[] {
  const options = exclude_paired_value(
    field,
    state,
    state.foreign_key_options?.[field.field_name] ?? [],
  );
  return prefer_matching_gender(
    selected_gender_ids(field, fields, state),
    options,
  );
}
