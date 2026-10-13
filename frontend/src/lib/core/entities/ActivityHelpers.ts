import { create_failure_result, create_success_result } from "../types/Result";
import { ACTIVITY_CATEGORY_TYPE } from "./ActivityCategory";
import {
  ACTIVITY_TITLE_MAXIMUM_LENGTH,
  ACTIVITY_VALIDATION_MESSAGES,
  COMPETITION_ACTIVITY_DESCRIPTION_PREFIX,
  FIXTURE_ACTIVITY_DESCRIPTION,
  FIXTURE_ACTIVITY_DURATION_MS,
} from "./ActivityConstants";
import type { Activity, CreateActivityInput } from "./ActivityTypes";
import {
  ACTIVITY_STATUS,
  DEFAULT_REMINDERS,
  NO_ACTIVITY_RECURRENCE,
} from "./ActivityTypes";
import {
  check_condition,
  check_required_entity_id,
  type FieldCheck,
  is_blank_text,
} from "./EntityValidation";
import { ACTIVITY_SOURCE_TYPE } from "./StatusConstants";

type ActivityFieldCheck = readonly [keyof CreateActivityInput, FieldCheck];

export function validate_activity_input(input: CreateActivityInput): {
  is_valid: boolean;
  errors: Record<string, string>;
} {
  const checks: ReadonlyArray<ActivityFieldCheck> = [
    ["title", check_activity_title(input.title)],
    [
      "organization_id",
      check_required_entity_id(
        input.organization_id,
        ACTIVITY_VALIDATION_MESSAGES.ORGANIZATION_REQUIRED,
      ),
    ],
    [
      "category_id",
      check_required_entity_id(
        input.category_id,
        ACTIVITY_VALIDATION_MESSAGES.CATEGORY_REQUIRED,
      ),
    ],
    [
      "start_datetime",
      check_condition(
        Boolean(input.start_datetime),
        ACTIVITY_VALIDATION_MESSAGES.START_REQUIRED,
      ),
    ],
    ["end_datetime", check_activity_end(input)],
  ];
  const errors: Record<string, string> = Object.fromEntries(
    checks.flatMap(([field, check]) =>
      check.success ? [] : [[field, check.error]],
    ),
  );
  return { is_valid: Object.keys(errors).length === 0, errors };
}

function check_activity_title(title: string | undefined): FieldCheck {
  if (is_blank_text(title)) {
    return create_failure_result(ACTIVITY_VALIDATION_MESSAGES.TITLE_REQUIRED);
  }
  return check_condition(
    (title ?? "").trim().length <= ACTIVITY_TITLE_MAXIMUM_LENGTH,
    ACTIVITY_VALIDATION_MESSAGES.TITLE_TOO_LONG,
  );
}

function check_activity_end(input: CreateActivityInput): FieldCheck {
  if (!input.end_datetime) {
    return create_failure_result(ACTIVITY_VALIDATION_MESSAGES.END_REQUIRED);
  }
  if (!input.start_datetime) {
    return create_success_result(true);
  }
  return check_condition(
    new Date(input.end_datetime) >= new Date(input.start_datetime),
    ACTIVITY_VALIDATION_MESSAGES.END_BEFORE_START,
  );
}

export function create_activity_from_fixture(
  fixture_id: NonNullable<CreateActivityInput["fixture_id"]>,
  fixture_title: CreateActivityInput["title"],
  fixture_datetime: CreateActivityInput["start_datetime"],
  competition_id: NonNullable<CreateActivityInput["competition_id"]>,
  home_team_id: CreateActivityInput["team_ids"][number],
  away_team_id: CreateActivityInput["team_ids"][number],
  organization_id: CreateActivityInput["organization_id"],
  category_id: CreateActivityInput["category_id"],
  venue_location: CreateActivityInput["location"],
): CreateActivityInput {
  const start_datetime = new Date(fixture_datetime);
  const end_datetime = new Date(
    start_datetime.getTime() + FIXTURE_ACTIVITY_DURATION_MS,
  );

  return {
    title: fixture_title,
    description: FIXTURE_ACTIVITY_DESCRIPTION,
    organization_id,
    category_id,
    category_type: ACTIVITY_CATEGORY_TYPE.FIXTURE,
    start_datetime: start_datetime.toISOString(),
    end_datetime: end_datetime.toISOString(),
    is_all_day: false,
    location: venue_location,
    venue_id: "",
    team_ids: [home_team_id, away_team_id],
    competition_id,
    fixture_id,
    source_type: ACTIVITY_SOURCE_TYPE.FIXTURE,
    source_id: fixture_id,
    status: ACTIVITY_STATUS.SCHEDULED,
    recurrence: NO_ACTIVITY_RECURRENCE,
    reminders: [...DEFAULT_REMINDERS],
    color_override: "",
    notes: "",
  };
}

export function create_activity_from_competition(
  competition_id: NonNullable<CreateActivityInput["competition_id"]>,
  competition_name: CreateActivityInput["title"],
  start_date: CreateActivityInput["start_datetime"],
  end_date: CreateActivityInput["end_datetime"],
  organization_id: CreateActivityInput["organization_id"],
  category_id: CreateActivityInput["category_id"],
  location: CreateActivityInput["location"],
): CreateActivityInput {
  return {
    title: competition_name,
    description: `${COMPETITION_ACTIVITY_DESCRIPTION_PREFIX}${competition_name}`,
    organization_id,
    category_id,
    category_type: ACTIVITY_CATEGORY_TYPE.COMPETITION,
    start_datetime: start_date,
    end_datetime: end_date,
    is_all_day: true,
    location,
    venue_id: "",
    team_ids: [],
    competition_id,
    fixture_id: "",
    source_type: ACTIVITY_SOURCE_TYPE.COMPETITION,
    source_id: competition_id,
    status: ACTIVITY_STATUS.SCHEDULED,
    recurrence: NO_ACTIVITY_RECURRENCE,
    reminders: [...DEFAULT_REMINDERS],
    color_override: "",
    notes: "",
  };
}

export function can_edit_activity(activity: Activity): boolean {
  return activity.source_type === ACTIVITY_SOURCE_TYPE.MANUAL;
}

export function can_delete_activity(activity: Activity): boolean {
  return activity.source_type === ACTIVITY_SOURCE_TYPE.MANUAL;
}
