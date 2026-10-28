import type {
  CompetitionFormatStageTemplate,
  FormatType,
  LeagueConfig,
} from "$lib/core/entities/CompetitionFormat";
import { create_default_league_config } from "$lib/core/entities/CompetitionFormatFactories";
import { FORMAT_TYPE } from "$lib/core/entities/StatusConstants";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { build_stage_template_defaults } from "$lib/presentation/logic/competitionFormatStageTemplateLogic";

import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { DYNAMIC_ENTITY_FORM_EVENT } from "./dynamicEntityFormMessages";
import { DYNAMIC_FORM_FIELD_TYPE } from "./dynamicFormConstants";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { get_default_value_for_field_type } from "./dynamicFormLogic";

export function is_competition_format_entity_type(
  entity_type: string,
): boolean {
  return is_dynamic_form_entity_type(
    entity_type,
    DYNAMIC_FORM_ENTITY_TYPE.COMPETITION_FORMAT,
  );
}

export function build_dynamic_form_stage_template_defaults(
  current_form_data: Record<string, unknown>,
): ScalarInput<CompetitionFormatStageTemplate>[] {
  const format_type =
    (current_form_data[DYNAMIC_FORM_FIELD_NAME.FORMAT_TYPE] as
      | FormatType
      | undefined) ?? FORMAT_TYPE.LEAGUE;
  const league_config =
    (current_form_data[DYNAMIC_FORM_FIELD_NAME.LEAGUE_CONFIG] as
      | LeagueConfig
      | undefined) ?? create_default_league_config();
  return build_stage_template_defaults(format_type, league_config);
}

function resolve_initial_field_value(
  field: FieldMetadata,
  existing_data: Partial<BaseEntity> | undefined,
  authorization_preselect: Record<string, string>,
): unknown {
  const existing_values: DynamicFormData = { ...existing_data };
  const existing_value = existing_values[field.field_name];
  if (existing_value != void 0) return existing_value;
  if (authorization_preselect[field.field_name])
    return authorization_preselect[field.field_name];
  return get_default_value_for_field_type(field);
}

function hydrate_competition_format_stage_templates(
  new_form_data: DynamicFormData,
  entity_type: string,
): DynamicFormData {
  if (!is_competition_format_entity_type(entity_type)) return new_form_data;
  if (!(DYNAMIC_FORM_FIELD_NAME.STAGE_TEMPLATES in new_form_data))
    return new_form_data;
  const current_stage_templates =
    new_form_data[DYNAMIC_FORM_FIELD_NAME.STAGE_TEMPLATES];
  if (
    Array.isArray(current_stage_templates) &&
    current_stage_templates.length > 0
  )
    return new_form_data;
  return {
    ...new_form_data,
    stage_templates: build_dynamic_form_stage_template_defaults(new_form_data),
  };
}

export function build_dynamic_form_initial_data(
  metadata: EntityMetadata,
  existing_data: Partial<BaseEntity> | undefined,
  authorization_preselect: Record<string, string>,
  entity_type: string,
): DynamicFormData {
  const new_form_data: DynamicFormData = {};
  const record_fields = metadata.fields.filter(
    (field) => field.field_type !== DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY,
  );
  for (const field of record_fields) {
    new_form_data[field.field_name] = resolve_initial_field_value(
      field,
      existing_data,
      authorization_preselect,
    );
  }
  return hydrate_competition_format_stage_templates(new_form_data, entity_type);
}

export function create_dynamic_form_initialization_key(command: {
  entity_type: string;
  metadata: EntityMetadata;
  existing_data: Partial<BaseEntity> | undefined;
  authorization_preselect: Record<string, string>;
}): string {
  return JSON.stringify({
    entity_type: command.entity_type,
    entity_name: command.metadata.entity_name,
    field_names: command.metadata.fields.map(
      (field: FieldMetadata) => field.field_name,
    ),
    authorization_preselect: Object.fromEntries(
      Object.entries(command.authorization_preselect).sort(
        ([first_key], [second_key]) => first_key.localeCompare(second_key),
      ),
    ),
    existing_data: command.existing_data,
  });
}

function apply_sub_entity_scope<TRecord extends Record<string, unknown>>(
  base_record: TRecord | undefined,
  sub_filter: SubEntityFilter,
): DynamicFormData {
  const scoped_record: DynamicFormData = {
    ...base_record,
    [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
  };
  if (sub_filter.holder_type_field && sub_filter.holder_type_value) {
    scoped_record[sub_filter.holder_type_field] = sub_filter.holder_type_value;
  }
  return scoped_record;
}

export function create_sub_entity_crud_handlers(
  child_entity_type: string,
  sub_filter: SubEntityFilter,
): EntityCrudHandlers {
  const child_use_cases_result =
    get_use_cases_for_entity_type(child_entity_type);

  if (!child_use_cases_result.success) {
    console.error("[DynamicEntityForm] No use cases for sub entity type", {
      event: DYNAMIC_ENTITY_FORM_EVENT.SUB_ENTITY_USE_CASES_MISSING,
      child_entity_type,
      error: child_use_cases_result.error,
    });
    return {};
  }

  const child_use_cases = child_use_cases_result.data;
  return {
    create: async (input: Record<string, unknown>) =>
      child_use_cases.create(apply_sub_entity_scope(input, sub_filter)),
    update: async (id: string, input: Record<string, unknown>) =>
      child_use_cases.update(id, input),
    delete: async (id: string) => child_use_cases.delete(id),
    list: async (
      filter?: Record<string, string>,
      options?: { page_number?: number; page_size?: number },
    ) =>
      child_use_cases.list(apply_sub_entity_scope(filter, sub_filter), options),
  };
}
