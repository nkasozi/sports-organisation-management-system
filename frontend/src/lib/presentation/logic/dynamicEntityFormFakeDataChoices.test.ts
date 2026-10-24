import { describe, expect, it } from "vitest";

import { fill_required_foreign_keys } from "./dynamicEntityFormFakeDataForeignKeys";
import { build_dynamic_form_fake_data_state } from "./dynamicEntityFormLocalActions";

const team_metadata = {
  entity_name: "team",
  fields: [
    {
      field_name: "name",
      display_name: "Name",
      field_type: "string",
      is_required: true,
      is_read_only: false,
    },
    {
      field_name: "organization_id",
      display_name: "Organization",
      field_type: "foreign_key",
      is_required: true,
      is_read_only: false,
    },
    {
      field_name: "gender_id",
      display_name: "Gender",
      field_type: "foreign_key",
      is_required: true,
      is_read_only: false,
    },
    {
      field_name: "home_venue_id",
      display_name: "Home Venue",
      field_type: "foreign_key",
      is_required: false,
      is_read_only: false,
    },
    {
      field_name: "status",
      display_name: "Status",
      field_type: "enum",
      enum_values: ["disqualified", "inactive", "active"],
      is_required: true,
      is_read_only: false,
    },
  ],
};

type TestFormState = {
  form_data: Record<string, unknown>;
  foreign_key_options: Record<string, { id: string }[]>;
};

function create_form(form_data: Record<string, unknown>): {
  state: TestFormState;
  changes: string[];
  run: (locked?: string[]) => Promise<void>;
} {
  const state: TestFormState = {
    form_data,
    foreign_key_options: {
      organization_id: [{ id: "org_1" }],
      gender_id: [],
      home_venue_id: [{ id: "venue_1" }],
    },
  };
  const changes: string[] = [];
  const run = (locked: string[] = []): Promise<void> =>
    fill_required_foreign_keys({
      fields: team_metadata.fields as never,
      get_form_state: () => state as never,
      locked_field_names: new Set(locked),
      change_foreign_key: async (field_name: string, value: string) => {
        changes.push(`${field_name}=${value}`);
        state.form_data = { ...state.form_data, [field_name]: value };
        if (field_name === "organization_id")
          state.foreign_key_options = {
            ...state.foreign_key_options,
            gender_id: [{ id: "female" }],
          };
      },
    });
  return { state, changes, run };
}

describe("fake data choices for dropdowns", () => {
  it("chooses the organisation through the normal change so dependent options load, then the gender", async () => {
    const form = create_form({});
    await form.run();
    expect(form.changes).toEqual(["organization_id=org_1", "gender_id=female"]);
  });

  it("leaves optional dropdowns for the user", async () => {
    const form = create_form({});
    await form.run();
    expect(form.state.form_data.home_venue_id ?? "").toBe("");
  });

  it("keeps a dropdown the user already chose or that is locked", async () => {
    const chosen = create_form({ organization_id: "org_2" });
    await chosen.run();
    expect(chosen.changes).toEqual([]);
    const locked = create_form({});
    await locked.run(["organization_id"]);
    expect(locked.changes).toEqual([]);
  });

  it("chooses an active status for a new record", () => {
    const filled = build_dynamic_form_fake_data_state(
      team_metadata as never,
      false,
      {
        form_data: {},
        validation_errors: {},
        foreign_key_options: {},
      } as never,
      new Set(),
    ).form_data;
    expect(filled.status).toBe("active");
  });
});
