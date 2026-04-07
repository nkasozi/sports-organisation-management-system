import type { BaseEntity } from "../../core/entities/BaseEntity";
import { detect_jersey_color_clashes } from "../../core/entities/Fixture";
import type { JerseyColor } from "../../core/entities/JerseyColor";

export function build_dynamic_form_jersey_color_warnings(
  entity_type: string,
  form_data: Record<string, any>,
  foreign_key_options: Record<string, BaseEntity[]>,
): string[] {
  if (entity_type.toLowerCase() !== "fixturedetailssetup") {
    return [];
  }

  const home_jersey = find_matching_jersey(
    foreign_key_options["home_team_jersey_id"] || [],
    form_data["home_team_jersey_id"],
  );
  const away_jersey = find_matching_jersey(
    foreign_key_options["away_team_jersey_id"] || [],
    form_data["away_team_jersey_id"],
  );
  const official_jersey = find_matching_jersey(
    foreign_key_options["official_jersey_id"] || [],
    form_data["official_jersey_id"],
  );

  return detect_jersey_color_clashes(
    build_jersey_assignment(home_jersey),
    build_jersey_assignment(away_jersey),
    build_jersey_assignment(official_jersey),
    "Home Team",
    "Away Team",
  ).map((warning) => warning.message);
}

function find_matching_jersey(
  jerseys: BaseEntity[],
  jersey_id: string,
): JerseyColor | undefined {
  return jerseys.find((jersey) => jersey.id === jersey_id) as
    | JerseyColor
    | undefined;
}

function build_jersey_assignment(jersey: JerseyColor | undefined):
  | {
      jersey_color_id: string;
      nickname: string;
      main_color: string;
    }
  | undefined {
  if (!jersey) return undefined;
  return {
    jersey_color_id: jersey.id,
    nickname: jersey.nickname,
    main_color: jersey.main_color,
  };
}
