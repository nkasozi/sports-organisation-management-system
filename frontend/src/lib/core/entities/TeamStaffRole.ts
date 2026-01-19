import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface TeamStaffRole extends BaseEntity {
  name: string;
  code: string;
  description: string;
  category: "coaching" | "medical" | "administrative" | "technical" | "other";
  is_primary_contact: boolean;
  display_order: number;
  status: EntityStatus;
}

export type CreateTeamStaffRoleInput = Omit<
  TeamStaffRole,
  "id" | "created_at" | "updated_at"
>;
export type UpdateTeamStaffRoleInput = Partial<CreateTeamStaffRoleInput>;

export function create_empty_team_staff_role_input(): CreateTeamStaffRoleInput {
  return {
    name: "",
    code: "",
    description: "",
    category: "coaching",
    is_primary_contact: false,
    display_order: 0,
    status: "active",
  };
}

export function get_default_team_staff_roles(): CreateTeamStaffRoleInput[] {
  return [
    {
      name: "Head Coach",
      code: "HC",
      description:
        "Primary coach responsible for team strategy and player development",
      category: "coaching",
      is_primary_contact: true,
      display_order: 1,
      status: "active",
    },
    {
      name: "Assistant Coach",
      code: "AC",
      description: "Assists the head coach with training and match preparation",
      category: "coaching",
      is_primary_contact: false,
      display_order: 2,
      status: "active",
    },
    {
      name: "Goalkeeping Coach",
      code: "GKC",
      description: "Specialized coach for goalkeeper training",
      category: "coaching",
      is_primary_contact: false,
      display_order: 3,
      status: "active",
    },
    {
      name: "Fitness Coach",
      code: "FC",
      description: "Responsible for player fitness and conditioning",
      category: "coaching",
      is_primary_contact: false,
      display_order: 4,
      status: "active",
    },
    {
      name: "Team Manager",
      code: "TM",
      description: "Handles administrative and logistical aspects of the team",
      category: "administrative",
      is_primary_contact: true,
      display_order: 5,
      status: "active",
    },
    {
      name: "Team Doctor",
      code: "DOC",
      description: "Medical professional responsible for player health",
      category: "medical",
      is_primary_contact: false,
      display_order: 6,
      status: "active",
    },
    {
      name: "Physiotherapist",
      code: "PHYSIO",
      description: "Treats and prevents injuries through physical therapy",
      category: "medical",
      is_primary_contact: false,
      display_order: 7,
      status: "active",
    },
    {
      name: "Sports Psychologist",
      code: "PSY",
      description: "Provides mental health support and performance psychology",
      category: "medical",
      is_primary_contact: false,
      display_order: 8,
      status: "active",
    },
    {
      name: "Performance Analyst",
      code: "PA",
      description: "Analyzes match and training data to improve performance",
      category: "technical",
      is_primary_contact: false,
      display_order: 9,
      status: "active",
    },
    {
      name: "Kit Manager",
      code: "KM",
      description: "Manages team equipment and uniforms",
      category: "administrative",
      is_primary_contact: false,
      display_order: 10,
      status: "active",
    },
  ];
}

export function validate_team_staff_role_input(
  input: CreateTeamStaffRoleInput,
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
