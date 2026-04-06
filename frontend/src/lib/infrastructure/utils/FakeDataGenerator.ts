import { faker } from "@faker-js/faker";
import type { FieldMetadata } from "../../core/entities/BaseEntity";
import {
  generate_fake_string_value,
  generate_fake_number_value,
  generate_fake_date_value,
} from "./fakeDataFieldGenerators";

export interface FakeDataGeneratorConfig {
  locale?: string;
  seed?: number;
  enable_fake_data_generation?: boolean;
}

export interface FakeDataGenerationResult {
  success: boolean;
  generated_data: Record<string, any>;
  error_message?: string;
  debug_info?: string;
}

class FakeDataGeneratorService {
  private config: FakeDataGeneratorConfig;

  constructor(config: FakeDataGeneratorConfig = {}) {
    this.config = {
      locale: "en",
      seed: undefined,
      enable_fake_data_generation: true,
      ...config,
    };

    if (this.config.seed) {
      faker.seed(this.config.seed);
    }
  }

  generate_fake_data_for_entity_fields(
    fields: FieldMetadata[],
  ): FakeDataGenerationResult {
    if (!this.config.enable_fake_data_generation) {
      return {
        success: false,
        generated_data: {},
        error_message: "Fake data generation is disabled",
        debug_info: "Check enable_fake_data_generation config setting",
      };
    }

    try {
      const generated_data: Record<string, any> = {};

      for (const field of fields) {
        if (
          field.is_read_only ||
          field.field_name === "id" ||
          field.field_name === "created_at" ||
          field.field_name === "updated_at"
        ) {
          continue;
        }

        const fake_value = this.generate_fake_value_for_field(field);
        generated_data[field.field_name] = fake_value;
      }

      return {
        success: true,
        generated_data,
        debug_info: `Generated fake data for ${Object.keys(generated_data).length} fields`,
      };
    } catch (error) {
      return {
        success: false,
        generated_data: {},
        error_message: `Failed to generate fake data: ${error}`,
        debug_info: "Error occurred during fake data generation process",
      };
    }
  }

  private generate_fake_value_for_field(field: FieldMetadata): any {
    if (
      field.field_type === "enum" &&
      field.enum_values &&
      field.enum_values.length > 0
    ) {
      return faker.helpers.arrayElement(field.enum_values);
    }
    if (field.field_type === "foreign_key") return "";
    if (field.field_type === "stage_template_array") return [];

    const field_name_lower = field.field_name.toLowerCase();

    switch (field.field_type) {
      case "string":
        return generate_fake_string_value(field_name_lower, field.display_name);
      case "number":
        return generate_fake_number_value(field_name_lower);
      case "boolean":
        return faker.datatype.boolean();
      case "date":
        return generate_fake_date_value(field_name_lower);
      default:
        return "";
    }
  }

  update_config(new_config: Partial<FakeDataGeneratorConfig>): void {
    this.config = { ...this.config, ...new_config };
    if (new_config.seed !== undefined) {
      faker.seed(new_config.seed);
    }
  }

  is_fake_data_generation_enabled(): boolean {
    return this.config.enable_fake_data_generation === true;
  }
}

export const fakeDataGenerator = new FakeDataGeneratorService({
  enable_fake_data_generation: true,
  locale: "en",
});
