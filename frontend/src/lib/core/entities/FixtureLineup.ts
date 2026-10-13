import type {
  EntityId,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";
import type { LineupStatusValue } from "./StatusConstants";

export type LineupStatus = LineupStatusValue;

export const PLAYER_TIME_ON = {
  PRESENT_AT_START: "present_at_start",
  DIDNT_PLAY: "didnt_play",
} as const;

const NO_TIME_ON_DISPLAY = "";
const PRESENT_AT_START_DISPLAY = "X";

export type PlayerTimeOnStatus =
  | (typeof PLAYER_TIME_ON)[keyof typeof PLAYER_TIME_ON]
  | (string & {});

export interface LineupPlayer {
  id: EntityId;
  first_name: Name;
  last_name: Name;
  jersey_number: number;
  position: Name;
  is_captain: boolean;
  is_substitute: boolean;
  time_on?: PlayerTimeOnStatus;
}

export interface FixtureLineup extends BaseEntity {
  organization_id: EntityId;
  fixture_id: EntityId;
  team_id: EntityId;
  selected_players: LineupPlayer[];
  status: LineupStatus;
  submitted_by: EntityId;
  submitted_at: IsoDateTimeString;
  notes: string;
}

export type CreateFixtureLineupInput = Omit<
  ScalarInput<FixtureLineup>,
  "id" | "created_at" | "updated_at" | "submitted_at" | "status"
> & {
  status?: LineupStatus;
  submitted_at?: string;
};

export type UpdateFixtureLineupInput = Partial<
  Omit<
    ScalarInput<FixtureLineup>,
    "id" | "created_at" | "updated_at" | "fixture_id" | "team_id"
  >
>;

export function create_empty_fixture_lineup_input(
  organization_id: CreateFixtureLineupInput["organization_id"] = "",
  fixture_id: CreateFixtureLineupInput["fixture_id"] = "",
  team_id: CreateFixtureLineupInput["team_id"] = "",
): CreateFixtureLineupInput {
  return {
    organization_id,
    fixture_id,
    team_id,
    selected_players: [],
    submitted_by: "",
    notes: "",
  };
}

export function get_time_on_display(
  time_on: PlayerTimeOnStatus | undefined,
): string {
  if (!time_on || time_on === PLAYER_TIME_ON.DIDNT_PLAY) {
    return NO_TIME_ON_DISPLAY;
  }
  if (time_on === PLAYER_TIME_ON.PRESENT_AT_START) {
    return PRESENT_AT_START_DISPLAY;
  }
  return time_on;
}

export function get_default_time_on_for_player(
  is_substitute: boolean,
): PlayerTimeOnStatus {
  return is_substitute
    ? PLAYER_TIME_ON.DIDNT_PLAY
    : PLAYER_TIME_ON.PRESENT_AT_START;
}
