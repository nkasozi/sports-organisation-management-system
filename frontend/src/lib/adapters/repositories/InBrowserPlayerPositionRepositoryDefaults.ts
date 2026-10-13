import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../core/types/DomainScalars";

type DefaultPlayerPositionRow = Omit<
  ScalarInput<PlayerPosition>,
  "created_at" | "updated_at" | "id" | "organization_id"
> & { id_prefix: string };

const DEFAULT_PLAYER_POSITION_BASE = {
  sport_type: "Field Hockey",
  is_available: true,
  status: "active" as const,
};

const DEFAULT_PLAYER_POSITION_ROWS: DefaultPlayerPositionRow[] = [
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_gk",
    name: "Goalkeeper",
    code: "GK",
    category: "goalkeeper" as const,
    description: "Protects the goal and prevents scoring",
    display_order: 1,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_sw",
    name: "Sweeper",
    code: "SW",
    category: "defender" as const,
    description: "Last line of defense in front of goalkeeper",
    display_order: 2,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_cb",
    name: "Center Back",
    code: "CB",
    category: "defender" as const,
    description: "Central defensive position",
    display_order: 3,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_lb",
    name: "Left Back",
    code: "LB",
    category: "defender" as const,
    description: "Left side defensive position",
    display_order: 4,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_rb",
    name: "Right Back",
    code: "RB",
    category: "defender" as const,
    description: "Right side defensive position",
    display_order: 5,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_cdm",
    name: "Defensive Midfielder",
    code: "CDM",
    category: "midfielder" as const,
    description: "Central defensive midfield position",
    display_order: 6,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_cm",
    name: "Center Midfielder",
    code: "CM",
    category: "midfielder" as const,
    description: "Central midfield position",
    display_order: 7,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_lm",
    name: "Left Midfielder",
    code: "LM",
    category: "midfielder" as const,
    description: "Left side midfield position",
    display_order: 8,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_rm",
    name: "Right Midfielder",
    code: "RM",
    category: "midfielder" as const,
    description: "Right side midfield position",
    display_order: 9,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_lw",
    name: "Left Wing",
    code: "LW",
    category: "forward" as const,
    description: "Left attacking wing position",
    display_order: 10,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_rw",
    name: "Right Wing",
    code: "RW",
    category: "forward" as const,
    description: "Right attacking wing position",
    display_order: 11,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_cf",
    name: "Center Forward",
    code: "CF",
    category: "forward" as const,
    description: "Central attacking forward position",
    display_order: 12,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_st",
    name: "Striker",
    code: "ST",
    category: "forward" as const,
    description: "Main goal scoring position",
    display_order: 13,
  },
  {
    ...DEFAULT_PLAYER_POSITION_BASE,
    id_prefix: "player_position_hockey_if",
    name: "Inside Forward",
    code: "IF",
    category: "forward" as const,
    description: "Inside attacking forward supporting strikers",
    display_order: 14,
  },
];

export function create_default_player_positions_for_organization(
  organization_id: ScalarValueInput<PlayerPosition["organization_id"]>,
): ScalarInput<PlayerPosition>[] {
  const now = new Date().toISOString();
  return DEFAULT_PLAYER_POSITION_ROWS.map(
    ({ id_prefix, ...row }) =>
      ({
        ...row,
        id: `${id_prefix}_${organization_id}`,
        organization_id,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<PlayerPosition>,
  );
}
