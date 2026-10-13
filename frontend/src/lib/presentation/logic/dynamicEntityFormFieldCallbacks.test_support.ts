import { type Mock, vi } from "vitest";

type FieldCallbacksTestState = {
  form_state: {
    form_data: Record<string, unknown>;
    foreign_key_options: Record<string, unknown>;
    all_competition_teams_cache: unknown[];
    validation_errors: Record<string, unknown>;
  };
  warning_state: {
    color_clash_warnings: unknown[];
    official_team_conflict_warnings: unknown[];
    gender_mismatch_warnings: unknown[];
    fixture_team_gender_mismatch_warnings: unknown[];
  };
};

type FieldCallbacksTestDependencies = {
  entity_type: string;
  get_entity_metadata: () => never;
  get_form_state: () => never;
  set_form_state: Mock<(next_state: unknown) => void>;
  get_warning_state: () => never;
  set_warning_state: Mock<(next_state: unknown) => void>;
  navigate_to_foreign_entity: Mock<() => boolean>;
  conflict_dependencies: never;
  gender_dependencies: never;
};

type FieldCallbacksTestContext = {
  dependencies: FieldCallbacksTestDependencies;
  state: FieldCallbacksTestState;
};

export function create_dependencies(): FieldCallbacksTestContext {
  const state: FieldCallbacksTestState = {
    form_state: {
      form_data: { player_id: "player-1" },
      foreign_key_options: {},
      all_competition_teams_cache: [],
      validation_errors: {},
    },
    warning_state: {
      color_clash_warnings: [],
      official_team_conflict_warnings: [],
      gender_mismatch_warnings: [],
      fixture_team_gender_mismatch_warnings: [],
    },
  };

  const dependencies: FieldCallbacksTestDependencies = {
    entity_type: "FixtureDetailsSetup",
    get_entity_metadata: () => ({ fields: [] }) as never,
    get_form_state: () => state.form_state as never,
    set_form_state: vi.fn((next_state: unknown) => {
      state.form_state = next_state as never;
    }),
    get_warning_state: () => state.warning_state as never,
    set_warning_state: vi.fn((next_state: unknown) => {
      state.warning_state = next_state as never;
    }),
    navigate_to_foreign_entity: vi.fn(() => true),
    conflict_dependencies: {} as never,
    gender_dependencies: {} as never,
  };

  return { dependencies, state };
}
