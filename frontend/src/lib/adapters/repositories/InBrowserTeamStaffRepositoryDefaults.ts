import type { TeamStaff } from "../../core/entities/TeamStaff";
import { DEFAULT_STAFF_AVATAR } from "../../core/entities/TeamStaff";

export function create_default_team_staff(): import("$lib/core/types/DomainScalars").ScalarInput<TeamStaff>[] {
  const now = new Date().toISOString();
  const BASE = {
    organization_id: "org_default_1",
    nationality: "Ugandan",
    profile_image_url: DEFAULT_STAFF_AVATAR,
    employment_end_date: "",
    notes: "",
    status: "active" as const,
    created_at: now,
    updated_at: now,
  };

  return [
    {
      ...BASE,
      id: "team_staff_default_1",
      first_name: "John",
      last_name: "Mukasa",
      email: "john.mukasa@ugandahockey.org",
      phone: "+256-700-111-001",
      date_of_birth: "1975-03-15",
      team_id: "team_default_1",
      role_id: "staff_role_default_1",
      employment_start_date: "2018-01-01",
      emergency_contact_name: "Sarah Mukasa",
      emergency_contact_phone: "+256-700-111-002",
    },
    {
      ...BASE,
      id: "team_staff_default_2",
      first_name: "Grace",
      last_name: "Nalwanga",
      email: "grace.nalwanga@ugandahockey.org",
      phone: "+256-700-222-001",
      date_of_birth: "1980-07-22",
      team_id: "team_default_1",
      role_id: "staff_role_default_2",
      employment_start_date: "2019-06-15",
      emergency_contact_name: "Peter Nalwanga",
      emergency_contact_phone: "+256-700-222-002",
    },
    {
      ...BASE,
      id: "team_staff_default_3",
      first_name: "David",
      last_name: "Okello",
      email: "david.okello@ugandahockey.org",
      phone: "+256-700-333-001",
      date_of_birth: "1985-11-10",
      team_id: "team_default_2",
      role_id: "staff_role_default_1",
      employment_start_date: "2020-02-01",
      emergency_contact_name: "Mary Okello",
      emergency_contact_phone: "+256-700-333-002",
    },
  ];
}
