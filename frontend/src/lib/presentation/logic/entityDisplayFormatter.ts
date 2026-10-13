import {
  is_blank_string_value,
  is_string_value,
} from "$lib/presentation/logic/runtimeTypeGuards";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { DEFAULT_ENTITY_DISPLAY_NAME } from "./entityCrudWrapperConstants";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function format_fixture_date_time(
  scheduled_date: unknown,
  scheduled_time: unknown,
): string {
  if (!is_string_value(scheduled_date) || scheduled_date.trim() === "")
    return "";
  const date = new Date(scheduled_date);
  if (isNaN(date.getTime())) return "";
  const formatted_date = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  if (is_string_value(scheduled_time) && scheduled_time.trim() !== "") {
    return `${formatted_date} - ${scheduled_time}`;
  }
  return formatted_date;
}

export function build_entity_display_label(entity: BaseEntity): string {
  const record = entity as unknown as Record<string, unknown>;

  const nickname = record["nickname"];
  const main_color = record["main_color"];
  if (
    is_string_value(nickname) &&
    nickname.trim() !== "" &&
    is_string_value(main_color) &&
    main_color.trim() !== ""
  ) {
    return `${nickname} - ${main_color}`;
  }

  const name = record["name"];
  if (is_string_value(name) && name.trim() !== "") return name;

  const first_name = record["first_name"];
  const last_name = record["last_name"];
  if (
    is_string_value(first_name) &&
    is_string_value(last_name) &&
    (first_name.trim() !== "" || last_name.trim() !== "")
  ) {
    return `${first_name} ${last_name}`.trim();
  }

  const title = record["title"];
  if (is_string_value(title) && title.trim() !== "") return title;

  return build_fixture_display_label(record, entity.id);
}

function build_fixture_display_label(
  record: Record<string, unknown>,
  entity_id: string,
): string {
  const home_team_id = record["home_team_id"];
  const away_team_id = record["away_team_id"];
  if (!is_string_value(home_team_id) || !is_string_value(away_team_id))
    return entity_id;

  const date_time_suffix = format_fixture_date_time(
    record["scheduled_date"],
    record["scheduled_time"],
  );
  const home_team_name = record["home_team_name"];
  const away_team_name = record["away_team_name"];
  const competition_name = record["competition_name"];

  if (is_string_value(home_team_name) && is_string_value(away_team_name)) {
    return [
      is_blank_string_value(competition_name) ? "" : String(competition_name),
      `${home_team_name} vs ${away_team_name}`,
      date_time_suffix,
    ]
      .filter((part: string) => part.length > 0)
      .join(" - ");
  }

  const round_name = record["round_name"];
  if (date_time_suffix) return `Fixture [${date_time_suffix}]`;
  if (is_string_value(round_name) && round_name.trim() !== "")
    return `Fixture (${round_name})`;
  return `Fixture: ${entity_id.slice(0, 8)}`;
}

export function get_display_value_for_foreign_key(
  options: BaseEntity[],
  value?: string,
): string {
  const normalized_value = String(value ?? "").trim();
  const found_option = options.find(
    (option) =>
      String((option as BaseEntity).id ?? "").trim() === normalized_value,
  );
  if (found_option) return build_entity_display_label(found_option);
  return normalized_value;
}

export function format_entity_display_name(raw_name: string): string {
  if (!is_string_value(raw_name) || raw_name.length === 0)
    return DEFAULT_ENTITY_DISPLAY_NAME;
  const with_spaces = raw_name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return with_spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function format_enum_label(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const FOREIGN_ENTITY_LINKS: ReadonlyMap<
  string,
  { route: string; cta_label: string }
> = new Map([
  ["player", { route: "/players", cta_label: "Create Players" }],
  ["team", { route: "/teams", cta_label: "Create Teams" }],
  [
    "organization",
    { route: "/organizations", cta_label: "Create Organizations" },
  ],
  ["competition", { route: "/competitions", cta_label: "Create Competitions" }],
  ["fixture", { route: "/fixtures", cta_label: "Create Fixtures" }],
  [
    "playerposition",
    { route: "/player-positions", cta_label: "Create Player Positions" },
  ],
  ["venue", { route: "/venues", cta_label: "Create Venues" }],
]);
const DEFAULT_FOREIGN_ENTITY_CTA_LABEL = "Create";

function normalize_foreign_entity_type(entity_type?: string): string {
  return is_string_value(entity_type) ? entity_type.toLowerCase() : "";
}

export function build_foreign_entity_route(entity_type?: string): string {
  return (
    FOREIGN_ENTITY_LINKS.get(normalize_foreign_entity_type(entity_type))
      ?.route ?? ""
  );
}

export function build_foreign_entity_cta_label(entity_type?: string): string {
  return (
    FOREIGN_ENTITY_LINKS.get(normalize_foreign_entity_type(entity_type))
      ?.cta_label ?? DEFAULT_FOREIGN_ENTITY_CTA_LABEL
  );
}
