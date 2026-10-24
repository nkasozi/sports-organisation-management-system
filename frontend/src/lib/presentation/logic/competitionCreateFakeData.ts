import { faker } from "@faker-js/faker";

import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { fakeDataGenerator } from "$lib/infrastructure/utils/FakeDataGenerator";
import { NO_FAKE_DATA_HINTS } from "$lib/infrastructure/utils/fakeDataScenario";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

const COMPETITION_ENTITY_TYPE = "competition";
const EMPTY_CHOICE = "";

const FAKE_COMPETITION_FIELDS = [
  "name",
  "description",
  "start_date",
  "end_date",
  "registration_deadline",
] as const satisfies readonly (keyof CreateCompetitionInput)[];

function competition_field(
  field_name: string,
  field_type: FieldMetadata["field_type"],
): FieldMetadata {
  return {
    field_name,
    display_name: field_name,
    field_type,
    is_required: true,
    is_read_only: false,
  } as FieldMetadata;
}

const COMPETITION_FAKE_FIELD_METADATA: FieldMetadata[] = [
  competition_field("name", "string"),
  competition_field("description", "string"),
  competition_field("start_date", "date"),
  competition_field("end_date", "date"),
  competition_field("registration_deadline", "date"),
];

export function build_competition_create_fake_fields(
  form_data: CreateCompetitionInput,
  sport_name: Option<string> = create_none_option(),
): CreateCompetitionInput {
  const result = fakeDataGenerator.generate_fake_data_for_entity_fields(
    COMPETITION_FAKE_FIELD_METADATA,
    COMPETITION_ENTITY_TYPE,
    { ...NO_FAKE_DATA_HINTS, sport_name },
  );
  if (!result.success) return form_data;
  const generated = Object.fromEntries(
    FAKE_COMPETITION_FIELDS.map((field_name) => [
      field_name,
      String(result.generated_data[field_name] ?? form_data[field_name]),
    ]),
  );
  return { ...form_data, ...generated };
}

export function pick_fake_option_for_empty_choice(
  current_value: string,
  options: SelectOption[],
): Option<string> {
  if (current_value !== EMPTY_CHOICE || options.length === 0)
    return create_none_option();
  return create_some_option(faker.helpers.arrayElement(options).value);
}

interface CompetitionCreateFakeDataCommand {
  get_form_data(): CreateCompetitionInput;
  set_form_data(form_data: CreateCompetitionInput): void;
  get_organization_options(): SelectOption[];
  get_competition_format_options(): SelectOption[];
  get_sport_name(): Option<string>;
  change_organization(event: CustomEvent<{ value: string }>): Promise<void>;
  change_format(event: CustomEvent<{ value: string }>): void;
}

const CHOICE_CHANGE_EVENT = "change";

function choice_event(value: string): CustomEvent<{ value: string }> {
  return new CustomEvent(CHOICE_CHANGE_EVENT, { detail: { value } });
}

async function fill_empty_organization(
  command: CompetitionCreateFakeDataCommand,
): Promise<void> {
  const organization = pick_fake_option_for_empty_choice(
    command.get_form_data().organization_id,
    command.get_organization_options(),
  );
  if (organization.status === OptionStatus.SOME)
    await command.change_organization(choice_event(organization.value));
}

export async function fill_competition_create_fake_data(
  command: CompetitionCreateFakeDataCommand,
): Promise<void> {
  await fill_empty_organization(command);
  command.set_form_data(
    build_competition_create_fake_fields(
      command.get_form_data(),
      command.get_sport_name(),
    ),
  );
  const format = pick_fake_option_for_empty_choice(
    command.get_form_data().competition_format_id,
    command.get_competition_format_options(),
  );
  if (format.status === OptionStatus.SOME)
    command.change_format(choice_event(format.value));
}
