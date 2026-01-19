import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface GameOfficialRole extends BaseEntity {
  name: string;
  code: string;
  description: string;
  sport_id: string | null;
  is_on_field: boolean;
  is_head_official: boolean;
  display_order: number;
  status: EntityStatus;
}

export type CreateGameOfficialRoleInput = Omit<
  GameOfficialRole,
  "id" | "created_at" | "updated_at"
>;
export type UpdateGameOfficialRoleInput = Partial<CreateGameOfficialRoleInput>;

export function create_empty_game_official_role_input(
  sport_id: string | null = null,
): CreateGameOfficialRoleInput {
  return {
    name: "",
    code: "",
    description: "",
    sport_id,
    is_on_field: true,
    is_head_official: false,
    display_order: 0,
    status: "active",
  };
}

export function get_default_football_official_roles(): CreateGameOfficialRoleInput[] {
  return [
    {
      name: "Referee",
      code: "REF",
      description:
        "Main match official responsible for enforcing the laws of the game",
      sport_id: null,
      is_on_field: true,
      is_head_official: true,
      display_order: 1,
      status: "active",
    },
    {
      name: "Assistant Referee",
      code: "AR",
      description:
        "Assists the referee, primarily with offside decisions and throw-in directions",
      sport_id: null,
      is_on_field: true,
      is_head_official: false,
      display_order: 2,
      status: "active",
    },
    {
      name: "Fourth Official",
      code: "4TH",
      description:
        "Assists with administrative duties and substitution procedures",
      sport_id: null,
      is_on_field: false,
      is_head_official: false,
      display_order: 3,
      status: "active",
    },
    {
      name: "VAR Official",
      code: "VAR",
      description:
        "Video Assistant Referee who reviews decisions using video footage",
      sport_id: null,
      is_on_field: false,
      is_head_official: false,
      display_order: 4,
      status: "active",
    },
    {
      name: "AVAR Official",
      code: "AVAR",
      description: "Assistant Video Assistant Referee",
      sport_id: null,
      is_on_field: false,
      is_head_official: false,
      display_order: 5,
      status: "active",
    },
    {
      name: "Goal Line Official",
      code: "GLO",
      description: "Additional assistant referee positioned near the goal line",
      sport_id: null,
      is_on_field: true,
      is_head_official: false,
      display_order: 6,
      status: "active",
    },
  ];
}

export function get_default_football_official_roles_with_ids(): GameOfficialRole[] {
  const now = new Date().toISOString();
  const input_roles = get_default_football_official_roles();
  return input_roles.map((input, index) => ({
    id: `role_default_${index + 1}`,
    created_at: now,
    updated_at: now,
    ...input,
  }));
}

export function validate_game_official_role_input(
  input: CreateGameOfficialRoleInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Role name must be at least 2 characters");
  }

  if (!input.code || input.code.trim().length < 2) {
    validation_errors.push("Role code must be at least 2 characters");
  }

  return validation_errors;
}
