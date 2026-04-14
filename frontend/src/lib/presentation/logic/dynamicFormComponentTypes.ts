import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

export type DynamicFormFieldCallbacks = {
  set_scalar_value: (field_name: string, value: unknown) => boolean;
  set_managed_value: (field_name: string, value: unknown) => boolean;
  handle_foreign_key_change: (
    field_name: string,
    value: string,
  ) => Promise<void>;
  handle_file_change: (event: Event, field_name: string) => Promise<void>;
  handle_official_assignments_change: (
    field_name: string,
    assignments: ScalarInput<OfficialAssignment>[],
  ) => Promise<void>;
  navigate_to_foreign_entity: (entity_type: string | undefined) => boolean;
};

export type DynamicFormAlertTone =
  | "secondary"
  | "blue"
  | "red"
  | "violet"
  | "yellow";

export type DynamicFormAlertIcon = "info" | "warning" | "lock" | "error";
