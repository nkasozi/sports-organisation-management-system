import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../../core/types/Option";
import type { FakeDataGenerationResult } from "../../infrastructure/utils/FakeDataGenerator";
import {
  type FakeDataHints,
  NO_FAKE_DATA_HINTS,
} from "../../infrastructure/utils/fakeDataScenario";
import {
  find_selected_option_entity,
  type ForeignKeyCandidateState,
} from "./dynamicEntityFormFakeDataCandidates";
import { refine_fixture_fake_data } from "./dynamicEntityFormFakeDataFixture";
import { normalize_entity_type } from "./entityCrudWrapperLogic";
import { is_string_value } from "./runtimeTypeGuards";

const REFINED_ENTITY = {
  FIXTURE: "fixture",
  ORGANIZATION: "organization",
  PLAYER: "player",
  OFFICIAL: "official",
  TEAM_STAFF: "teamstaff",
  SYSTEM_USER: "systemuser",
} as const;

const FAKE_DATA_REFINED_EVENT = "dynamic_form_fake_data_refined";
const GENDER_FIELD_NAME = "gender_id";
const SPORT_FIELD_NAME = "sport_id";
const OPTION_NAME_FIELD = "name";

const PERSON_NAME_FIELDS: readonly string[] = [
  "first_name",
  "last_name",
  "email",
  "emergency_contact_name",
];

const ORGANIZATION_NAME_FIELDS: readonly string[] = [
  "name",
  "description",
  "contact_email",
  "website",
  "address",
];

type FakeDataGenerate = (
  fields: FieldMetadata[],
  entity_type: string,
  hints: FakeDataHints,
) => FakeDataGenerationResult;

interface FakeDataRefinementCommand {
  entity_type: string;
  fields: FieldMetadata[];
  form_state: ForeignKeyCandidateState;
  locked_field_names: ReadonlySet<string>;
  today: Date;
  generate_fake_data: FakeDataGenerate;
}

function read_selected_name(
  state: ForeignKeyCandidateState,
  field_name: string,
): Option<string> {
  const selected = find_selected_option_entity(state, field_name);
  if (selected.status !== OptionStatus.SOME) return create_none_option();
  const name = (selected.value as BaseEntity & Record<string, unknown>)[
    OPTION_NAME_FIELD
  ];
  return is_string_value(name) && name.length > 0
    ? create_some_option(name)
    : create_none_option();
}

function regenerate_fields(
  command: FakeDataRefinementCommand,
  hints: FakeDataHints,
  field_names: readonly string[],
): Record<string, unknown> {
  const result = command.generate_fake_data(
    command.fields,
    command.entity_type,
    hints,
  );
  if (!result.success) return {};
  return Object.fromEntries(
    field_names
      .filter((field_name) => field_name in result.generated_data)
      .map((field_name) => [field_name, result.generated_data[field_name]]),
  );
}

function refine_with_hint(
  command: FakeDataRefinementCommand,
  hint: { key: keyof FakeDataHints; field_name: string },
  field_names: readonly string[],
): Record<string, unknown> {
  const name = read_selected_name(command.form_state, hint.field_name);
  if (name.status !== OptionStatus.SOME) return {};
  return regenerate_fields(
    command,
    { ...NO_FAKE_DATA_HINTS, [hint.key]: name },
    field_names,
  );
}

function build_refinements(
  command: FakeDataRefinementCommand,
): Record<string, unknown> {
  switch (command.entity_type) {
    case REFINED_ENTITY.FIXTURE:
      return refine_fixture_fake_data(command.form_state, command.today);
    case REFINED_ENTITY.ORGANIZATION:
      return refine_with_hint(
        command,
        { key: "sport_name", field_name: SPORT_FIELD_NAME },
        ORGANIZATION_NAME_FIELDS,
      );
    case REFINED_ENTITY.PLAYER:
    case REFINED_ENTITY.OFFICIAL:
    case REFINED_ENTITY.TEAM_STAFF:
    case REFINED_ENTITY.SYSTEM_USER:
      return refine_with_hint(
        command,
        { key: "gender_name", field_name: GENDER_FIELD_NAME },
        PERSON_NAME_FIELDS,
      );
    default:
      return {};
  }
}

export function refine_fake_data_after_choices(
  raw_command: FakeDataRefinementCommand,
): Record<string, unknown> {
  const command = {
    ...raw_command,
    entity_type: normalize_entity_type(raw_command.entity_type),
  };
  const refinements = Object.entries(build_refinements(command)).filter(
    ([field_name]) => !command.locked_field_names.has(field_name),
  );
  console.debug("[DynamicEntityForm] Fake data refined after choices", {
    event: FAKE_DATA_REFINED_EVENT,
    entity_type: command.entity_type,
    refined_field_count: refinements.length,
  });
  return {
    ...command.form_state.form_data,
    ...Object.fromEntries(refinements),
  };
}
