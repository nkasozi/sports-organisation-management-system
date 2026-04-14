import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { ScalarValueInput } from "../../core/types/DomainScalars";

export function create_default_team_staff_roles_for_organization(
  organization_id: ScalarValueInput<TeamStaffRole["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<TeamStaffRole>[] {
  const now = new Date().toISOString();
  const BASE = {
    status: "active" as const,
    organization_id,
    created_at: now,
    updated_at: now,
  };

  return [
    {
      ...BASE,
      id: `team_staff_role_default_1_${organization_id}`,
      name: "Head Coach",
      code: "HC",
      description:
        "Primary coach responsible for team strategy and player development",
      category: "coaching" as const,
      is_primary_contact: true,
      display_order: 1,
    },
    {
      ...BASE,
      id: `team_staff_role_default_2_${organization_id}`,
      name: "Assistant Coach",
      code: "AC",
      description: "Assists the head coach with training and match preparation",
      category: "coaching" as const,
      is_primary_contact: false,
      display_order: 2,
    },
    {
      ...BASE,
      id: `team_staff_role_default_3_${organization_id}`,
      name: "Goalkeeping Coach",
      code: "GKC",
      description: "Specialized coach for goalkeeper training",
      category: "coaching" as const,
      is_primary_contact: false,
      display_order: 3,
    },
    {
      ...BASE,
      id: `team_staff_role_default_4_${organization_id}`,
      name: "Fitness Coach",
      code: "FC",
      description: "Responsible for player fitness and conditioning",
      category: "coaching" as const,
      is_primary_contact: false,
      display_order: 4,
    },
    {
      ...BASE,
      id: `team_staff_role_default_5_${organization_id}`,
      name: "Team Manager",
      code: "TM",
      description: "Handles administrative and logistical aspects of the team",
      category: "administrative" as const,
      is_primary_contact: true,
      display_order: 5,
    },
    {
      ...BASE,
      id: `team_staff_role_default_6_${organization_id}`,
      name: "Team Doctor",
      code: "DOC",
      description: "Medical professional responsible for player health",
      category: "medical" as const,
      is_primary_contact: false,
      display_order: 6,
    },
    {
      ...BASE,
      id: `team_staff_role_default_7_${organization_id}`,
      name: "Physiotherapist",
      code: "PHYSIO",
      description: "Treats and prevents injuries through physical therapy",
      category: "medical" as const,
      is_primary_contact: false,
      display_order: 7,
    },
    {
      ...BASE,
      id: `team_staff_role_default_8_${organization_id}`,
      name: "Sports Psychologist",
      code: "PSY",
      description: "Provides mental health support and performance psychology",
      category: "medical" as const,
      is_primary_contact: false,
      display_order: 8,
    },
    {
      ...BASE,
      id: `team_staff_role_default_9_${organization_id}`,
      name: "Performance Analyst",
      code: "PA",
      description: "Analyzes match and training data to improve performance",
      category: "technical" as const,
      is_primary_contact: false,
      display_order: 9,
    },
    {
      ...BASE,
      id: `team_staff_role_default_10_${organization_id}`,
      name: "Kit Manager",
      code: "KM",
      description: "Manages team equipment and uniforms",
      category: "administrative" as const,
      is_primary_contact: false,
      display_order: 10,
    },
  ] as TeamStaffRole[];
}
