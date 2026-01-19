// Fake data generator utility using faker-js
// Follows coding rules: well-named functions, explicit return types, stateless helpers
import { faker } from "@faker-js/faker";
import type { FieldMetadata } from "../../core/entities/BaseEntity";

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

    // Note: Locale setting in newer faker versions is handled differently
    // For now we'll use the default English locale

    // Set seed for reproducible fake data if provided
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
        // Skip read-only fields like timestamps and IDs
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
    // Handle enum fields first
    if (
      field.field_type === "enum" &&
      field.enum_values &&
      field.enum_values.length > 0
    ) {
      return faker.helpers.arrayElement(field.enum_values);
    }

    // Handle foreign key fields - return empty string for now (will be populated by dropdown)
    if (field.field_type === "foreign_key") {
      return "";
    }

    // Generate based on field name patterns and types
    const field_name_lower = field.field_name.toLowerCase();

    // String field generation with smart field name detection
    if (field.field_type === "string") {
      return this.generate_fake_string_value(
        field_name_lower,
        field.display_name,
      );
    }

    // Number field generation
    if (field.field_type === "number") {
      return this.generate_fake_number_value(field_name_lower);
    }

    // Boolean field generation
    if (field.field_type === "boolean") {
      return faker.datatype.boolean();
    }

    // Date field generation
    if (field.field_type === "date") {
      return this.generate_fake_date_value(field_name_lower);
    }

    // Default fallback
    return "";
  }

  private generate_fake_string_value(
    field_name: string,
    display_name: string,
  ): string {
    // Email detection
    if (field_name.includes("email")) {
      return faker.internet.email();
    }

    // Phone detection
    if (field_name.includes("phone") || field_name.includes("contact")) {
      return faker.phone.number();
    }

    // Name detection
    if (field_name.includes("first_name") || field_name.includes("firstname")) {
      return faker.person.firstName();
    }
    if (field_name.includes("last_name") || field_name.includes("lastname")) {
      return faker.person.lastName();
    }
    if (
      field_name.includes("name") &&
      !field_name.includes("user") &&
      !field_name.includes("file")
    ) {
      return faker.company.name();
    }

    // Address detection
    if (field_name.includes("address")) {
      return faker.location.streetAddress();
    }

    // Website/URL detection
    if (field_name.includes("website") || field_name.includes("url")) {
      return faker.internet.url();
    }

    // Description detection
    if (field_name.includes("description") || field_name.includes("desc")) {
      return faker.lorem.sentences(2);
    }

    // Title detection
    if (field_name.includes("title")) {
      return faker.lorem.words(3);
    }

    // Position detection
    if (field_name.includes("position")) {
      return faker.person.jobTitle();
    }

    // Venue detection
    if (field_name.includes("venue") || field_name.includes("location")) {
      return faker.location.city() + " Stadium";
    }

    // Coach detection
    if (field_name.includes("coach")) {
      return faker.person.fullName();
    }

    // Sport type detection
    if (field_name.includes("sport")) {
      return faker.helpers.arrayElement([
        "Football",
        "Basketball",
        "Tennis",
        "Soccer",
        "Baseball",
        "Hockey",
      ]);
    }

    // Color detection
    if (field_name.includes("color")) {
      return faker.internet.color();
    }

    // Specialization detection
    if (field_name.includes("specialization")) {
      return faker.helpers.arrayElement([
        "Football",
        "Basketball",
        "Tennis",
        "Soccer",
        "Baseball",
      ]);
    }

    // Emergency contact detection
    if (field_name.includes("emergency")) {
      return faker.person.fullName() + " - " + faker.phone.number();
    }

    // Generic text fallback
    return faker.lorem.words(2);
  }

  private generate_fake_number_value(field_name: string): number {
    // Year detection
    if (field_name.includes("year")) {
      return faker.date
        .between({ from: "1950-01-01", to: "2024-12-31" })
        .getFullYear();
    }

    // Age detection
    if (field_name.includes("age")) {
      return faker.number.int({ min: 18, max: 65 });
    }

    // Experience detection
    if (field_name.includes("experience")) {
      return faker.number.int({ min: 0, max: 30 });
    }

    // Score detection
    if (field_name.includes("score")) {
      return faker.number.int({ min: 0, max: 10 });
    }

    // Jersey number detection
    if (field_name.includes("jersey")) {
      return faker.number.int({ min: 1, max: 99 });
    }

    // Rating detection
    if (field_name.includes("rating")) {
      return faker.number.int({ min: 1, max: 5 });
    }

    // Max teams detection
    if (field_name.includes("max_teams")) {
      return faker.number.int({ min: 4, max: 32 });
    }

    // Duration detection
    if (field_name.includes("duration")) {
      return faker.number.int({ min: 60, max: 120 });
    }

    // Generic number fallback
    return faker.number.int({ min: 1, max: 100 });
  }

  private generate_fake_date_value(field_name: string): string {
    // Birth date detection
    if (field_name.includes("birth")) {
      return faker.date
        .between({ from: "1970-01-01", to: "2005-12-31" })
        .toISOString()
        .split("T")[0];
    }

    // Founded date detection
    if (field_name.includes("founded")) {
      return faker.date
        .between({ from: "1900-01-01", to: "2020-12-31" })
        .toISOString()
        .split("T")[0];
    }

    // Start date detection
    if (field_name.includes("start")) {
      return faker.date.future().toISOString().split("T")[0];
    }

    // End date detection
    if (field_name.includes("end")) {
      return faker.date.future({ years: 1 }).toISOString().split("T")[0];
    }

    // Expiry date detection
    if (field_name.includes("expiry")) {
      return faker.date.future({ years: 2 }).toISOString().split("T")[0];
    }

    // Registration deadline detection
    if (
      field_name.includes("registration") ||
      field_name.includes("deadline")
    ) {
      return faker.date.future({ years: 0.08 }).toISOString().split("T")[0]; // ~30 days
    }

    // Scheduled date detection
    if (field_name.includes("scheduled")) {
      return faker.date.future({ years: 0.2 }).toISOString().split("T")[0];
    }

    // Generic future date fallback
    return faker.date.future().toISOString().split("T")[0];
  }

  // Public method to update configuration
  update_config(new_config: Partial<FakeDataGeneratorConfig>): void {
    this.config = { ...this.config, ...new_config };

    // Note: Locale handling in newer faker versions requires different approach

    if (new_config.seed !== undefined) {
      faker.seed(new_config.seed);
    }
  }

  // Public method to check if fake data generation is enabled
  is_fake_data_generation_enabled(): boolean {
    return this.config.enable_fake_data_generation === true;
  }
}

// Export singleton instance
export const fakeDataGenerator = new FakeDataGeneratorService({
  enable_fake_data_generation: true,
  locale: "en",
});
