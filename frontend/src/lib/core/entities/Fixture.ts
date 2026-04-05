export type {
  FixtureStatus,
  GamePeriod,
  GameEventType,
  GameEvent,
  AssignedOfficial,
  JerseyColorAssignment,
  Fixture,
  CreateFixtureInput,
  UpdateFixtureInput,
} from "./FixtureTypes";

export {
  create_empty_fixture_input,
  validate_fixture_input,
  derive_groups_from_fixtures,
  validate_fixture_officials,
} from "./FixtureValidation";

export type {
  OfficialValidationResult,
  OfficialValidationError,
  OfficialValidationWarning,
} from "./FixtureValidation";

export {
  generate_round_robin_fixtures,
  FIXTURE_STATUS_OPTIONS,
} from "./FixtureGeneration";

export type { FixtureGenerationConfig } from "./FixtureGeneration";

export {
  get_quick_event_buttons,
  create_game_event,
  get_event_label,
  get_event_icon,
  format_event_time,
  get_period_display_name,
} from "./FixtureGameEvents";

export type { QuickEventButton } from "./FixtureGameEvents";

export {
  detect_jersey_color_clashes,
  has_color_clashes,
} from "./FixtureColorClash";

export type { ColorClashWarning } from "./FixtureColorClash";
