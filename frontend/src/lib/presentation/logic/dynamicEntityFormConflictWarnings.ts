import type { BaseEntity } from "../../core/entities/BaseEntity";
import { detect_jersey_color_clashes } from "../../core/entities/Fixture";
import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { ScalarInput } from "../../core/types/DomainScalars";

type JerseyAssignmentInput = ScalarInput<{
  jersey_color_id: string;
  nickname: string;
  main_color: string;
}>;

function create_empty_jersey_assignment(): JerseyAssignmentInput {
  return {
    jersey_color_id: "",
    nickname: "",
    main_color: "",
  };
}

export function build_dynamic_form_jersey_color_warnings(
  entity_type: string,
  form_data: Record<string, any>,
  foreign_key_options: Record<string, BaseEntity[]>,
): string[] {
  if (entity_type.toLowerCase() !== "fixturedetailssetup") {
    return [];
  }

  const home_jersey = resolve_jersey_assignment(
    foreign_key_options["home_team_jersey_id"] || [],
    form_data["home_team_jersey_id"],
  );
  const away_jersey = resolve_jersey_assignment(
    foreign_key_options["away_team_jersey_id"] || [],
    form_data["away_team_jersey_id"],
  );
  const official_jersey = resolve_jersey_assignment(
    foreign_key_options["official_jersey_id"] || [],
    form_data["official_jersey_id"],
  );

  return detect_jersey_color_clashes(
    home_jersey,
    away_jersey,
    official_jersey,
    "Home Team",
    "Away Team",
  ).map((warning) => warning.message);
}

function resolve_jersey_assignment(
  jerseys: BaseEntity[],
  jersey_id: string,
): JerseyAssignmentInput {
  const matching_jerseys = jerseys.filter(
    (jersey) => jersey.id === jersey_id,
  ) as JerseyColor[];
  if (matching_jerseys.length === 0) {
    return create_empty_jersey_assignment();
  }

  const jersey = matching_jerseys[0];
  return {
    jersey_color_id: jersey.id,
    nickname: jersey.nickname,
    main_color: jersey.main_color,
  };
}
