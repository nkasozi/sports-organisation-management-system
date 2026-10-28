import { ENTITY_STATUS } from "./StatusConstants";

const HOCKEY_ROLE_DISPLAY_ORDER_START = 7;

const HOCKEY_ROLES = [
  {
    name: "Main Umpire",
    code: "UMP1",
    description: "Lead umpire who controls the match and its half of the pitch",
    is_on_field: true,
    is_head_official: true,
    is_table_official: false,
  },
  {
    name: "Second Umpire",
    code: "UMP2",
    description: "Umpire who controls the other half of the pitch",
    is_on_field: true,
    is_head_official: false,
    is_table_official: false,
  },
  {
    name: "Video Umpire",
    code: "VU",
    description: "Reviews referred decisions using video footage",
    is_on_field: false,
    is_head_official: false,
    is_table_official: false,
  },
  {
    name: "Technical Officer",
    code: "TO",
    description: "Runs the technical table, substitutions and match timing",
    is_on_field: false,
    is_head_official: false,
    is_table_official: true,
  },
] as const;

export const DEFAULT_HOCKEY_OFFICIAL_ROLES = HOCKEY_ROLES.map(
  (role, index) => ({
    ...role,
    sport_id: "" as const,
    display_order: HOCKEY_ROLE_DISPLAY_ORDER_START + index,
    status: ENTITY_STATUS.ACTIVE,
  }),
);
