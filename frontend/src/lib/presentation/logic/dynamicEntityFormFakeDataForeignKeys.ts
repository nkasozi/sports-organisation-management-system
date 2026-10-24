import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../../core/types/Option";
import {
  type ForeignKeyCandidateState,
  list_foreign_key_candidates,
} from "./dynamicEntityFormFakeDataCandidates";
import {
  type FakeDataExclusions,
  NO_FAKE_DATA_EXCLUSIONS,
} from "./dynamicEntityFormFakeDataExclusions";

const FOREIGN_KEY_FIELD_TYPE = "foreign_key";
const EMPTY_FIELD_VALUE = "";

interface RequiredForeignKeyFillCommand {
  fields: FieldMetadata[];
  get_form_state(): ForeignKeyCandidateState;
  locked_field_names: ReadonlySet<string>;
  change_foreign_key(field_name: string, value: string): Promise<void>;
  excluded_option_ids?: FakeDataExclusions;
}

interface ForeignKeyChoice {
  field_name: string;
  value: string;
}

function is_empty_value(value: unknown): boolean {
  return value == void 0 || value === EMPTY_FIELD_VALUE;
}

function pick_random_option(options: BaseEntity[]): string {
  return String(options[Math.floor(Math.random() * options.length)].id);
}

function list_fillable_candidates(
  field: FieldMetadata,
  command: RequiredForeignKeyFillCommand,
  state: ForeignKeyCandidateState,
): BaseEntity[] {
  const candidates = list_foreign_key_candidates(field, command.fields, state);
  const excluded =
    (command.excluded_option_ids ?? NO_FAKE_DATA_EXCLUSIONS)[
      field.field_name
    ] ?? new Set<string>();
  const available = candidates.filter(
    (option) => !excluded.has(String(option.id)),
  );
  return available.length > 0 ? available : candidates;
}

function is_fillable_foreign_key(
  field: FieldMetadata,
  command: RequiredForeignKeyFillCommand,
  state: ForeignKeyCandidateState,
): boolean {
  return (
    field.field_type === FOREIGN_KEY_FIELD_TYPE &&
    field.is_required &&
    !field.is_read_only &&
    !command.locked_field_names.has(field.field_name) &&
    is_empty_value(state.form_data[field.field_name]) &&
    list_fillable_candidates(field, command, state).length > 0
  );
}

function choose_next_required_foreign_key(
  command: RequiredForeignKeyFillCommand,
): Option<ForeignKeyChoice> {
  const state = command.get_form_state();
  const field = command.fields.find((candidate) =>
    is_fillable_foreign_key(candidate, command, state),
  );
  if (!field) return create_none_option();
  return create_some_option({
    field_name: field.field_name,
    value: pick_random_option(list_fillable_candidates(field, command, state)),
  });
}

export async function fill_required_foreign_keys(
  command: RequiredForeignKeyFillCommand,
): Promise<void> {
  for (let round = 0; round < command.fields.length; round += 1) {
    const choice = choose_next_required_foreign_key(command);
    if (choice.status !== OptionStatus.SOME) return;
    await command.change_foreign_key(
      choice.value.field_name,
      choice.value.value,
    );
  }
}
