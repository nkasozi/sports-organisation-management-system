// Simple team service with in-memory data
export interface Team {
  id: string;
  name: string;
  competition_id: string;
  coach_name: string;
  coach_email: string;
  established_year: number;
  home_ground: string | null;
  team_color: string;
  logo_url: string | null;
  status: "active" | "inactive" | "disqualified";
  created_at: string;
  updated_at: string;
}

export interface CreateTeamData {
  name: string;
  competition_id: string;
  coach_name: string;
  coach_email: string;
  established_year: number;
  home_ground: string | null;
  team_color: string;
  logo_url: string | null;
  status: "active" | "inactive" | "disqualified";
}

// Simple in-memory storage
let teams: Team[] = [
  {
    id: "1",
    name: "City Eagles",
    competition_id: "1",
    coach_name: "John Smith",
    coach_email: "john@cityeagles.com",
    established_year: 2019,
    home_ground: "Eagle Stadium",
    team_color: "#FF0000",
    logo_url: null,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Metro Lions",
    competition_id: "1",
    coach_name: "Sarah Johnson",
    coach_email: "sarah@metrolions.com",
    established_year: 2020,
    home_ground: "Lion's Den",
    team_color: "#0000FF",
    logo_url: null,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class TeamServiceClass {
  async get_all_teams(): Promise<Team[]> {
    await delay();
    return [...teams];
  }

  async get_teams_by_competition(competition_id: string): Promise<Team[]> {
    await delay();
    return teams.filter((t) => t.competition_id === competition_id);
  }

  async get_team_by_id(id: string): Promise<Team> {
    await delay();
    const team = teams.find((t) => t.id === id);
    if (!team) throw new Error(`Team ${id} not found`);
    return { ...team };
  }

  async create_team(data: CreateTeamData): Promise<Team> {
    await delay();
    const now = new Date().toISOString();
    const newTeam: Team = {
      id: Date.now().toString(),
      ...data,
      created_at: now,
      updated_at: now,
    };
    teams.push(newTeam);
    return { ...newTeam };
  }

  async update_team(id: string, data: Partial<CreateTeamData>): Promise<Team> {
    await delay();
    const index = teams.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Team ${id} not found`);
    const updated = {
      ...teams[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    teams[index] = updated;
    return { ...updated };
  }

  async delete_team(id: string): Promise<boolean> {
    await delay();
    const index = teams.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Team ${id} not found`);
    teams.splice(index, 1);
    return true;
  }

  validate_team_data(data: CreateTeamData) {
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Team name is required";
    if (!data.competition_id?.trim())
      errors.competition_id = "Competition is required";
    if (!data.coach_name?.trim()) errors.coach_name = "Coach name is required";
    if (!data.coach_email?.trim() || !data.coach_email.includes("@")) {
      errors.coach_email = "Valid coach email is required";
    }
    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  get_status_badge_class(status: Team["status"]): string {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "disqualified":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }
}

export const teamService = new TeamServiceClass();
