import {
  apply_entity_input_defaults,
  remove_blank_entity_fields,
} from "./EntityInputDefaults";
import type { CreateTeamInput, UpdateTeamInput } from "./Team";

type TeamDefaultedFields = Pick<
  CreateTeamInput,
  | "short_name"
  | "description"
  | "captain_player_id"
  | "vice_captain_player_id"
  | "max_squad_size"
  | "home_venue_id"
  | "primary_color"
  | "secondary_color"
  | "logo_url"
  | "website"
>;

export const TEAM_INPUT_DEFAULTS: TeamDefaultedFields = {
  short_name: "",
  description: "",
  captain_player_id: "",
  vice_captain_player_id: "",
  max_squad_size: 25,
  home_venue_id: "",
  primary_color: "#3B82F6",
  secondary_color: "#FFFFFF",
  logo_url: "",
  website: "",
};

const TEAM_OPTIONAL_NUMBER_FIELDS = ["founded_year"] as const;

export function remove_blank_team_fields<
  TInput extends CreateTeamInput | UpdateTeamInput,
>(input: TInput): TInput {
  return remove_blank_entity_fields(input, TEAM_OPTIONAL_NUMBER_FIELDS);
}

export function apply_team_input_defaults(
  input: CreateTeamInput,
): CreateTeamInput {
  return remove_blank_team_fields(
    apply_entity_input_defaults(TEAM_INPUT_DEFAULTS, input),
  );
}
