import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../core/types/DomainScalars";

type DefaultTeamStaffRoleRow = Omit<
  ScalarInput<TeamStaffRole>,
  "created_at" | "updated_at" | "id" | "organization_id"
> & { id_prefix: string };

const DEFAULT_TEAM_STAFF_ROLE_BASE = {
  status: "active" as const,
};

const DEFAULT_TEAM_STAFF_ROLE_ROWS: DefaultTeamStaffRoleRow[] = [
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_1",
    name: "Head Coach",
    code: "HC",
    description:
      "Primary coach responsible for team strategy and player development",
    category: "coaching" as const,
    is_primary_contact: true,
    display_order: 1,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_2",
    name: "Assistant Coach",
    code: "AC",
    description: "Assists the head coach with training and match preparation",
    category: "coaching" as const,
    is_primary_contact: false,
    display_order: 2,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_3",
    name: "Goalkeeping Coach",
    code: "GKC",
    description: "Specialized coach for goalkeeper training",
    category: "coaching" as const,
    is_primary_contact: false,
    display_order: 3,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_4",
    name: "Fitness Coach",
    code: "FC",
    description: "Responsible for player fitness and conditioning",
    category: "coaching" as const,
    is_primary_contact: false,
    display_order: 4,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_5",
    name: "Team Manager",
    code: "TM",
    description: "Handles administrative and logistical aspects of the team",
    category: "administrative" as const,
    is_primary_contact: true,
    display_order: 5,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_6",
    name: "Team Doctor",
    code: "DOC",
    description: "Medical professional responsible for player health",
    category: "medical" as const,
    is_primary_contact: false,
    display_order: 6,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_7",
    name: "Physiotherapist",
    code: "PHYSIO",
    description: "Treats and prevents injuries through physical therapy",
    category: "medical" as const,
    is_primary_contact: false,
    display_order: 7,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_8",
    name: "Sports Psychologist",
    code: "PSY",
    description: "Provides mental health support and performance psychology",
    category: "medical" as const,
    is_primary_contact: false,
    display_order: 8,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_9",
    name: "Performance Analyst",
    code: "PA",
    description: "Analyzes match and training data to improve performance",
    category: "technical" as const,
    is_primary_contact: false,
    display_order: 9,
  },
  {
    ...DEFAULT_TEAM_STAFF_ROLE_BASE,
    id_prefix: "team_staff_role_default_10",
    name: "Kit Manager",
    code: "KM",
    description: "Manages team equipment and uniforms",
    category: "administrative" as const,
    is_primary_contact: false,
    display_order: 10,
  },
];

export function create_default_team_staff_roles_for_organization(
  organization_id: ScalarValueInput<TeamStaffRole["organization_id"]>,
): ScalarInput<TeamStaffRole>[] {
  const now = new Date().toISOString();
  return DEFAULT_TEAM_STAFF_ROLE_ROWS.map(
    ({ id_prefix, ...row }) =>
      ({
        ...row,
        id: `${id_prefix}_${organization_id}`,
        organization_id,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<TeamStaffRole>,
  );
}
