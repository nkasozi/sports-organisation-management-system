import type { ScalarInput } from "../types/DomainScalars";
import { calculate_delta_e, COLOR_PARSE_STATUS } from "./FixtureColorLab";
import type { JerseyColorAssignment } from "./FixtureTypes";

interface ColorClashWarning {
  party_a: string;
  party_b: string;
  color: string;
  delta_e: number;
  message: string;
}

const COLOR_SIMILARITY_THRESHOLD = 25;
const NO_COLOR_SIMILARITY_RESULT = { similar: false, delta_e: 100 } as const;

export type JerseyAssignmentInput = ScalarInput<JerseyColorAssignment>;

function create_empty_jersey_assignment(): JerseyAssignmentInput {
  return {
    jersey_color_id: "",
    nickname: "",
    main_color: "",
  };
}

function has_selected_jersey(jersey: JerseyAssignmentInput): boolean {
  return jersey.jersey_color_id.length > 0 && jersey.main_color.length > 0;
}

function colors_are_similar(
  color_a: string,
  color_b: string,
): { similar: boolean; delta_e: number } {
  if (!color_a || !color_b) return NO_COLOR_SIMILARITY_RESULT;

  const delta_e_result = calculate_delta_e(color_a, color_b);
  if (delta_e_result.status === COLOR_PARSE_STATUS.INVALID) {
    return NO_COLOR_SIMILARITY_RESULT;
  }

  return {
    similar: delta_e_result.delta_e < COLOR_SIMILARITY_THRESHOLD,
    delta_e: delta_e_result.delta_e,
  };
}

function get_similarity_description(delta_e: number): string {
  if (delta_e < 5) return "nearly identical";
  if (delta_e < 15) return "very similar";
  return "similar";
}

function build_color_pair_warnings(
  jersey_a: JerseyAssignmentInput,
  jersey_b: JerseyAssignmentInput,
  name_a: string,
  name_b: string,
): ColorClashWarning[] {
  if (!has_selected_jersey(jersey_a) || !has_selected_jersey(jersey_b)) {
    return [];
  }

  const result = colors_are_similar(jersey_a.main_color, jersey_b.main_color);
  if (!result.similar) {
    return [];
  }

  const similarity = get_similarity_description(result.delta_e);
  return [
    {
      party_a: name_a,
      party_b: name_b,
      color: jersey_a.main_color,
      delta_e: result.delta_e,
      message: `${name_a} and ${name_b} have ${similarity} jersey colors (Delta E: ${result.delta_e.toFixed(1)})`,
    },
  ];
}

export function detect_jersey_color_clashes(
  home_team_jersey: JerseyAssignmentInput,
  away_team_jersey: JerseyAssignmentInput,
  officials_jersey: JerseyAssignmentInput,
  home_team_name: string,
  away_team_name: string,
): ColorClashWarning[] {
  return [
    ...build_color_pair_warnings(
      home_team_jersey,
      away_team_jersey,
      home_team_name,
      away_team_name,
    ),
    ...build_color_pair_warnings(
      home_team_jersey,
      officials_jersey,
      home_team_name,
      "Officials",
    ),
    ...build_color_pair_warnings(
      away_team_jersey,
      officials_jersey,
      away_team_name,
      "Officials",
    ),
  ];
}

export function has_color_clashes(
  home_team_jersey: JerseyAssignmentInput,
  away_team_jersey: JerseyAssignmentInput,
  officials_jersey: JerseyAssignmentInput,
  home_team_name: string,
  away_team_name: string,
): boolean {
  return (
    detect_jersey_color_clashes(
      home_team_jersey,
      away_team_jersey,
      officials_jersey,
      home_team_name,
      away_team_name,
    ).length > 0
  );
}

export { create_empty_jersey_assignment };
