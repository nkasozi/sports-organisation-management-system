import type { BaseEntity } from "../../core/entities/BaseEntity";
import { detect_jersey_color_clashes } from "../../core/entities/Fixture";
import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  DYNAMIC_FORM_TEAM_LABEL,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { read_dynamic_form_text_value } from "./dynamicFormDataAccess";

type JerseyAssignmentInput = ScalarInput<{
  jersey_color_id: string;
  nickname: string;
  main_color: string;
}>;

function create_empty_jersey_assignment(): JerseyAssignmentInput {
  return {
    jersey_color_id: "",
    nickname: "",
    main_color: "",
  };
}

export function build_dynamic_form_jersey_color_warnings(
  entity_type: string,
  form_data: DynamicFormData,
  foreign_key_options: Record<string, BaseEntity[]>,
): string[] {
  if (
    !is_dynamic_form_entity_type(
      entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.FIXTURE_DETAILS_SETUP,
    )
  ) {
    return [];
  }

  return detect_jersey_color_clashes(
    resolve_jersey_field(
      DYNAMIC_FORM_FIELD_NAME.HOME_TEAM_JERSEY_ID,
      form_data,
      foreign_key_options,
    ),
    resolve_jersey_field(
      DYNAMIC_FORM_FIELD_NAME.AWAY_TEAM_JERSEY_ID,
      form_data,
      foreign_key_options,
    ),
    resolve_jersey_field(
      DYNAMIC_FORM_FIELD_NAME.OFFICIAL_JERSEY_ID,
      form_data,
      foreign_key_options,
    ),
    DYNAMIC_FORM_TEAM_LABEL.HOME,
    DYNAMIC_FORM_TEAM_LABEL.AWAY,
  ).map((warning) => warning.message);
}

function resolve_jersey_field(
  field_name: string,
  form_data: DynamicFormData,
  foreign_key_options: Record<string, BaseEntity[]>,
): JerseyAssignmentInput {
  return resolve_jersey_assignment(
    foreign_key_options[field_name] || [],
    read_dynamic_form_text_value(form_data, field_name),
  );
}

function resolve_jersey_assignment(
  jerseys: BaseEntity[],
  jersey_id: string,
): JerseyAssignmentInput {
  const matching_jerseys = jerseys.filter(
    (jersey) => jersey.id === jersey_id,
  ) as JerseyColor[];
  if (matching_jerseys.length === 0) {
    return create_empty_jersey_assignment();
  }

  const jersey = matching_jerseys[0];
  return {
    jersey_color_id: jersey.id,
    nickname: jersey.nickname,
    main_color: jersey.main_color,
  };
}
