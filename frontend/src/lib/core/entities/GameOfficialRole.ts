import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import { ENTITY_STATUS } from "./StatusConstants";

export interface GameOfficialRole extends BaseEntity {
  name: Name;
  code: string;
  description: string;
  sport_id: EntityId | "";
  is_on_field: boolean;
  is_head_official: boolean;
  display_order: number;
  status: EntityStatus;
  organization_id: EntityId;
}

export type CreateGameOfficialRoleInput = Omit<
  ScalarInput<GameOfficialRole>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateGameOfficialRoleInput = Partial<CreateGameOfficialRoleInput>;

const DEFAULT_FOOTBALL_OFFICIAL_ROLES: ReadonlyArray<
  Omit<CreateGameOfficialRoleInput, "organization_id">
> = [
  {
    name: "Referee",
    code: "REF",
    description:
      "Main match official responsible for enforcing the laws of the game",
    sport_id: "",
    is_on_field: true,
    is_head_official: true,
    display_order: 1,
    status: ENTITY_STATUS.ACTIVE,
  },
  {
    name: "Assistant Referee",
    code: "AR",
    description:
      "Assists the referee, primarily with offside decisions and throw-in directions",
    sport_id: "",
    is_on_field: true,
    is_head_official: false,
    display_order: 2,
    status: ENTITY_STATUS.ACTIVE,
  },
  {
    name: "Fourth Official",
    code: "4TH",
    description:
      "Assists with administrative duties and substitution procedures",
    sport_id: "",
    is_on_field: false,
    is_head_official: false,
    display_order: 3,
    status: ENTITY_STATUS.ACTIVE,
  },
  {
    name: "VAR Official",
    code: "VAR",
    description:
      "Video Assistant Referee who reviews decisions using video footage",
    sport_id: "",
    is_on_field: false,
    is_head_official: false,
    display_order: 4,
    status: ENTITY_STATUS.ACTIVE,
  },
  {
    name: "AVAR Official",
    code: "AVAR",
    description: "Assistant Video Assistant Referee",
    sport_id: "",
    is_on_field: false,
    is_head_official: false,
    display_order: 5,
    status: ENTITY_STATUS.ACTIVE,
  },
  {
    name: "Goal Line Official",
    code: "GLO",
    description: "Additional assistant referee positioned near the goal line",
    sport_id: "",
    is_on_field: true,
    is_head_official: false,
    display_order: 6,
    status: ENTITY_STATUS.ACTIVE,
  },
];

export function get_default_football_official_roles_with_ids(
  organization_id: CreateGameOfficialRoleInput["organization_id"],
): import("$lib/core/types/DomainScalars").ScalarInput<GameOfficialRole>[] {
  const now = new Date().toISOString();
  const input_roles = DEFAULT_FOOTBALL_OFFICIAL_ROLES;
  return input_roles.map((input, index) => ({
    ...input,
    id: `role_default_${index + 1}_${organization_id}` as GameOfficialRole["id"],
    created_at: now as BaseEntity["created_at"],
    updated_at: now as BaseEntity["updated_at"],
    organization_id,
  }));
}
