import { normalize_entity_type } from "./entityCrudWrapperLogic";
import {
  type FixtureDetailsSetupAutoPopulateDependencies,
  load_fixture_details_setup_auto_populated_data,
} from "./fixtureDetailsSetupAutoPopulate";
import { is_string_value } from "./runtimeTypeGuards";

const FIXTURE_DETAILS_SETUP_ENTITY_TYPE = "fixturedetailssetup";
const FIXTURE_FIELD_NAME = "fixture_id";
const NO_SUGGESTIONS: Record<string, unknown> = {};

export async function suggest_fixture_setup_details(
  command: {
    entity_type: string;
    form_data: Record<string, unknown>;
    locked_field_names: ReadonlySet<string>;
  },
  load_dependencies: () => FixtureDetailsSetupAutoPopulateDependencies,
): Promise<Record<string, unknown>> {
  if (
    normalize_entity_type(command.entity_type) !==
    FIXTURE_DETAILS_SETUP_ENTITY_TYPE
  )
    return NO_SUGGESTIONS;
  const fixture_id = command.form_data[FIXTURE_FIELD_NAME];
  if (!is_string_value(fixture_id) || fixture_id.length === 0)
    return NO_SUGGESTIONS;
  const suggestions = await load_fixture_details_setup_auto_populated_data(
    fixture_id,
    load_dependencies(),
  );
  return Object.fromEntries(
    Object.entries(suggestions).filter(
      ([field_name]) => !command.locked_field_names.has(field_name),
    ),
  );
}
