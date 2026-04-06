import type { BaseEntity } from "../../core/entities/BaseEntity";

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
  if (typeof scheduled_date !== "string" || scheduled_date.trim() === "")
    return "";
  const date = new Date(scheduled_date);
  if (isNaN(date.getTime())) return "";
  const formatted_date = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  if (typeof scheduled_time === "string" && scheduled_time.trim() !== "") {
    return `${formatted_date} - ${scheduled_time}`;
  }
  return formatted_date;
}

export function build_entity_display_label(entity: BaseEntity): string {
  const record = entity as unknown as Record<string, unknown>;

  const nickname = record["nickname"];
  const main_color = record["main_color"];
  if (
    typeof nickname === "string" &&
    nickname.trim() !== "" &&
    typeof main_color === "string" &&
    main_color.trim() !== ""
  ) {
    return `${nickname} - ${main_color}`;
  }

  const name = record["name"];
  if (typeof name === "string" && name.trim() !== "") return name;

  const first_name = record["first_name"];
  const last_name = record["last_name"];
  if (
    typeof first_name === "string" &&
    typeof last_name === "string" &&
    (first_name.trim() !== "" || last_name.trim() !== "")
  ) {
    return `${first_name} ${last_name}`.trim();
  }

  const title = record["title"];
  if (typeof title === "string" && title.trim() !== "") return title;

  return build_fixture_display_label(record, entity.id);
}

function build_fixture_display_label(
  record: Record<string, unknown>,
  entity_id: string,
): string {
  const home_team_id = record["home_team_id"];
  const away_team_id = record["away_team_id"];
  if (typeof home_team_id !== "string" || typeof away_team_id !== "string")
    return entity_id;

  const date_time_suffix = format_fixture_date_time(
    record["scheduled_date"],
    record["scheduled_time"],
  );
  const home_team_name = record["home_team_name"];
  const away_team_name = record["away_team_name"];
  const competition_name = record["competition_name"];

  if (
    typeof home_team_name === "string" &&
    typeof away_team_name === "string"
  ) {
    const teams_label = `${home_team_name} vs ${away_team_name}`;
    const parts: string[] = [];
    if (
      typeof competition_name === "string" &&
      competition_name.trim() !== ""
    ) {
      parts.push(competition_name);
    }
    parts.push(teams_label);
    if (date_time_suffix) {
      parts.push(date_time_suffix);
    }
    return parts.join(" - ");
  }

  const round_name = record["round_name"];
  if (date_time_suffix) return `Fixture [${date_time_suffix}]`;
  if (typeof round_name === "string" && round_name.trim() !== "")
    return `Fixture (${round_name})`;
  return `Fixture: ${entity_id.slice(0, 8)}`;
}

export function get_display_value_for_foreign_key(
  options: BaseEntity[],
  value: string,
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
  if (typeof raw_name !== "string" || raw_name.length === 0) return "Entity";
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

export function build_foreign_entity_route(
  entity_type: string | undefined,
): string {
  const normalized =
    typeof entity_type === "string" ? entity_type.toLowerCase() : "";
  if (normalized === "player") return "/players";
  if (normalized === "team") return "/teams";
  if (normalized === "organization") return "/organizations";
  if (normalized === "competition") return "/competitions";
  if (normalized === "fixture") return "/fixtures";
  if (normalized === "playerposition") return "/player-positions";
  if (normalized === "venue") return "/venues";
  return "";
}

export function build_foreign_entity_cta_label(
  entity_type: string | undefined,
): string {
  const normalized =
    typeof entity_type === "string" ? entity_type.toLowerCase() : "";
  if (normalized === "player") return "Create Players";
  if (normalized === "team") return "Create Teams";
  if (normalized === "organization") return "Create Organizations";
  if (normalized === "competition") return "Create Competitions";
  if (normalized === "fixture") return "Create Fixtures";
  if (normalized === "playerposition") return "Create Player Positions";
  if (normalized === "venue") return "Create Venues";
  return "Create";
}
