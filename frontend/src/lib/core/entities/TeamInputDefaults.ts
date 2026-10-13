import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreateTeamInput } from "./Team";

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

export function apply_team_input_defaults(
  input: CreateTeamInput,
): CreateTeamInput {
  return apply_entity_input_defaults(TEAM_INPUT_DEFAULTS, input);
}
