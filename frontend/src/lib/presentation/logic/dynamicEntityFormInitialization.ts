import type {
  CompetitionFormatStageTemplate,
  FormatType,
  LeagueConfig,
} from "$lib/core/entities/CompetitionFormat";
import { create_default_league_config } from "$lib/core/entities/CompetitionFormatFactories";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { build_stage_template_defaults } from "$lib/presentation/logic/competitionFormatStageTemplateLogic";

import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import { get_default_value_for_field_type } from "./dynamicFormLogic";

const COMPETITION_FORMAT_ENTITY_TYPE = "competitionformat";

export function get_dynamic_entity_metadata_for_type(
  entity_type: string,
): EntityMetadata | false {
  const normalized_type = entity_type.toLowerCase();
  const metadata = entityMetadataRegistry.get_entity_metadata(normalized_type);
  if (!metadata) {
    console.error(
      `No metadata found for entity type: ${entity_type} (normalized: ${normalized_type})`,
    );
  }
  return metadata;
}

export function is_competition_format_entity_type(
  entity_type: string,
): boolean {
  return (
    entity_type.toLowerCase().replace(/[\s_-]/g, "") ===
    COMPETITION_FORMAT_ENTITY_TYPE
  );
}

export function build_dynamic_form_stage_template_defaults(
  current_form_data: Record<string, unknown>,
): ScalarInput<CompetitionFormatStageTemplate>[] {
  const format_type =
    (current_form_data["format_type"] as FormatType | undefined) ?? "league";
  const league_config =
    (current_form_data["league_config"] as LeagueConfig | undefined) ??
    create_default_league_config();
  return build_stage_template_defaults(format_type, league_config);
}

export function build_dynamic_form_initial_data(
  metadata: EntityMetadata,
  existing_data: Partial<BaseEntity> | undefined,
  authorization_preselect: Record<string, string>,
  entity_type: string,
): Record<string, any> {
  const new_form_data: Record<string, any> = {};

  for (const field of metadata.fields) {
    if (
      existing_data &&
      existing_data[field.field_name as keyof BaseEntity] != void 0
    ) {
      new_form_data[field.field_name] =
        existing_data[field.field_name as keyof BaseEntity];
      continue;
    }

    if (authorization_preselect[field.field_name]) {
      new_form_data[field.field_name] =
        authorization_preselect[field.field_name];
      continue;
    }

    new_form_data[field.field_name] = get_default_value_for_field_type(field);
  }

  if (!is_competition_format_entity_type(entity_type)) {
    return new_form_data;
  }

  if (!("stage_templates" in new_form_data)) {
    return new_form_data;
  }

  const current_stage_templates = Array.isArray(
    new_form_data["stage_templates"],
  )
    ? (new_form_data[
        "stage_templates"
      ] as ScalarInput<CompetitionFormatStageTemplate>[])
    : [];

  if (current_stage_templates.length > 0) {
    return new_form_data;
  }

  return {
    ...new_form_data,
    stage_templates: build_dynamic_form_stage_template_defaults(new_form_data),
  };
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

export function create_sub_entity_crud_handlers(
  child_entity_type: string,
  sub_filter: SubEntityFilter,
): EntityCrudHandlers {
  const child_use_cases_result =
    get_use_cases_for_entity_type(child_entity_type);

  if (!child_use_cases_result.success) {
    console.error(
      `[SUB_ENTITY] No use cases found for child entity type: ${child_entity_type}`,
    );
    return {};
  }

  const child_use_cases = child_use_cases_result.data;
  return {
    create: async (input: Record<string, unknown>) => {
      const enriched_input = {
        ...input,
        [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
      };
      if (sub_filter.holder_type_field && sub_filter.holder_type_value) {
        enriched_input[sub_filter.holder_type_field] =
          sub_filter.holder_type_value;
      }
      return child_use_cases.create(enriched_input);
    },
    update: async (id: string, input: Record<string, unknown>) => {
      return child_use_cases.update(id, input);
    },
    delete: async (id: string) => {
      return child_use_cases.delete(id);
    },
    list: async (
      filter?: Record<string, string>,
      options?: { page_number?: number; page_size?: number },
    ) => {
      const merged_filter = {
        ...filter,
        [sub_filter.foreign_key_field]: sub_filter.foreign_key_value,
      };
      if (sub_filter.holder_type_field && sub_filter.holder_type_value) {
        merged_filter[sub_filter.holder_type_field] =
          sub_filter.holder_type_value;
      }
      return child_use_cases.list(merged_filter, options);
    },
  };
}

function get_dynamic_form_default_value(field: FieldMetadata): unknown {
  return get_default_value_for_field_type(field);
}
