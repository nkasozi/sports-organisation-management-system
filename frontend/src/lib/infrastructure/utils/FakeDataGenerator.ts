import { faker } from "@faker-js/faker";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import {
  FAKE_DATA_DEFAULT_LOCALE,
  FAKE_DATA_EMPTY_VALUE,
  FAKE_DATA_ERROR_MESSAGE,
  FAKE_DATA_FIELD_TYPE,
  FAKE_DATA_LOG_EVENT,
  FAKE_DATA_SKIPPED_FIELD_NAMES,
} from "./fakeDataConstants";
import {
  generate_fake_date_value,
  generate_fake_number_value,
  generate_fake_string_value,
} from "./fakeDataFieldGenerators";
import { is_number_value } from "./runtimeTypeGuards";

interface FakeDataGeneratorConfig {
  locale?: string;
  seed?: number;
  enable_fake_data_generation?: boolean;
}

type FakeDataGenerationResult =
  | { success: true; generated_data: Record<string, unknown> }
  | { success: false; error_message: string };

function generate_enum_value(field: FieldMetadata): unknown {
  const enum_values = field.enum_values ?? [];
  if (enum_values.length === 0) return FAKE_DATA_EMPTY_VALUE;
  return faker.helpers.arrayElement(enum_values);
}

function generate_fake_value_for_field(field: FieldMetadata): unknown {
  const field_name_lower = field.field_name.toLowerCase();
  switch (field.field_type) {
    case FAKE_DATA_FIELD_TYPE.ENUM:
      return generate_enum_value(field);
    case FAKE_DATA_FIELD_TYPE.STAGE_TEMPLATE_ARRAY:
      return [];
    case FAKE_DATA_FIELD_TYPE.STRING:
      return generate_fake_string_value(field_name_lower, field.display_name);
    case FAKE_DATA_FIELD_TYPE.NUMBER:
      return generate_fake_number_value(field_name_lower);
    case FAKE_DATA_FIELD_TYPE.BOOLEAN:
      return faker.datatype.boolean();
    case FAKE_DATA_FIELD_TYPE.DATE:
      return generate_fake_date_value(field_name_lower);
    case FAKE_DATA_FIELD_TYPE.FOREIGN_KEY:
    case FAKE_DATA_FIELD_TYPE.STAR_RATING:
    case FAKE_DATA_FIELD_TYPE.FILE:
    case FAKE_DATA_FIELD_TYPE.SUB_ENTITY:
    case FAKE_DATA_FIELD_TYPE.OFFICIAL_ASSIGNMENT_ARRAY:
      return FAKE_DATA_EMPTY_VALUE;
  }
}

function should_generate_field(field: FieldMetadata): boolean {
  if (field.is_read_only) return false;
  return !FAKE_DATA_SKIPPED_FIELD_NAMES.includes(field.field_name);
}

function build_fake_data(fields: FieldMetadata[]): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter(should_generate_field)
      .map((field) => [field.field_name, generate_fake_value_for_field(field)]),
  );
}

function apply_seed(seed: number | undefined): boolean {
  if (!is_number_value(seed)) return false;
  faker.seed(seed);
  return true;
}

class FakeDataGeneratorService {
  private config: FakeDataGeneratorConfig;

  constructor(config: FakeDataGeneratorConfig = {}) {
    this.config = {
      locale: FAKE_DATA_DEFAULT_LOCALE,
      enable_fake_data_generation: true,
      ...config,
    };
    apply_seed(this.config.seed);
  }

  generate_fake_data_for_entity_fields(
    fields: FieldMetadata[],
  ): FakeDataGenerationResult {
    if (!this.config.enable_fake_data_generation) {
      return {
        success: false,
        error_message: FAKE_DATA_ERROR_MESSAGE.DISABLED,
      };
    }
    try {
      return { success: true, generated_data: build_fake_data(fields) };
    } catch (error) {
      console.warn("[FakeDataGenerator] Failed to generate fake data", {
        event: FAKE_DATA_LOG_EVENT.GENERATION_FAILED,
        field_count: fields.length,
        error: String(error),
      });
      return { success: false, error_message: FAKE_DATA_ERROR_MESSAGE.FAILED };
    }
  }

  is_fake_data_generation_enabled(): boolean {
    return this.config.enable_fake_data_generation === true;
  }
}

export const fakeDataGenerator = new FakeDataGeneratorService({
  enable_fake_data_generation: true,
  locale: FAKE_DATA_DEFAULT_LOCALE,
});
