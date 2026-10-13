import type { PositionCategory } from "./PlayerPosition";

interface PlayerPositionPreset {
  name: string;
  code: string;
  category: PositionCategory;
  description: string;
}

const NETBALL_POSITIONS: readonly PlayerPositionPreset[] = [
  {
    name: "Goal Shooter",
    code: "GS",
    category: "forward",
    description: "Scores goals from inside the shooting circle",
  },
  {
    name: "Goal Attack",
    code: "GA",
    category: "forward",
    description: "Feeds and shoots from the attacking circle",
  },
  {
    name: "Wing Attack",
    code: "WA",
    category: "midfielder",
    description: "Feeds the shooters from the attacking third",
  },
  {
    name: "Centre",
    code: "C",
    category: "midfielder",
    description: "Links defence and attack across the court",
  },
  {
    name: "Wing Defence",
    code: "WD",
    category: "midfielder",
    description: "Marks the opposing wing attack",
  },
  {
    name: "Goal Defence",
    code: "GD",
    category: "defender",
    description: "Defends the circle against the goal attack",
  },
  {
    name: "Goal Keeper",
    code: "GK",
    category: "goalkeeper",
    description: "Defends the circle against the goal shooter",
  },
];

const BASKETBALL_POSITIONS: readonly PlayerPositionPreset[] = [
  {
    name: "Point Guard",
    code: "PG",
    category: "midfielder",
    description: "Runs the offence and handles the ball",
  },
  {
    name: "Shooting Guard",
    code: "SG",
    category: "forward",
    description: "Scores from the perimeter",
  },
  {
    name: "Small Forward",
    code: "SF",
    category: "forward",
    description: "Scores and defends on the wing",
  },
  {
    name: "Power Forward",
    code: "PF",
    category: "defender",
    description: "Plays close to the basket",
  },
  {
    name: "Center",
    code: "C",
    category: "defender",
    description: "Protects the rim and rebounds",
  },
];

const FOOTBALL_POSITIONS: readonly PlayerPositionPreset[] = [
  {
    name: "Goalkeeper",
    code: "GK",
    category: "goalkeeper",
    description: "Protects the goal",
  },
  {
    name: "Defender",
    code: "DF",
    category: "defender",
    description: "Stops the opposition from scoring",
  },
  {
    name: "Midfielder",
    code: "MF",
    category: "midfielder",
    description: "Links defence and attack",
  },
  {
    name: "Forward",
    code: "FW",
    category: "forward",
    description: "Leads the attack and scores goals",
  },
];

export const GENERAL_PLAYER_POSITION: PlayerPositionPreset = {
  name: "Player",
  code: "PL",
  category: "other",
  description: "General playing position",
};

export const SPORT_PLAYER_POSITION_PRESETS: Readonly<
  Record<string, readonly PlayerPositionPreset[]>
> = {
  NETBALL: NETBALL_POSITIONS,
  BASKETBALL: BASKETBALL_POSITIONS,
  FOOTBALL: FOOTBALL_POSITIONS,
};
