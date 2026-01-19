// Simple competition service with in-memory data
export interface Competition {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  start_date: string;
  end_date: string;
  sport_type: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  max_teams: number;
  registration_deadline: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompetitionData {
  name: string;
  description: string;
  organization_id: string;
  start_date: string;
  end_date: string;
  sport_type: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  max_teams: number;
  registration_deadline: string;
}

// Simple in-memory storage with localStorage persistence
const COMPETITION_STORAGE_KEY = "sports_competitions_data";

function loadCompetitionsFromStorage(): Competition[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(COMPETITION_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.competitions || getDefaultCompetitions();
      } catch (e) {
        console.warn("Failed to parse stored competitions, using defaults");
      }
    }
  }
  return getDefaultCompetitions();
}

function getDefaultCompetitions(): Competition[] {
  return [
    {
      id: "1",
      name: "Spring Championship",
      description: "Annual spring football championship",
      organization_id: "1",
      start_date: "2024-03-01",
      end_date: "2024-05-30",
      sport_type: "Football",
      status: "active",
      max_teams: 16,
      registration_deadline: "2024-02-15",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Basketball League 2024",
      description: "Professional basketball league season",
      organization_id: "2",
      start_date: "2024-04-01",
      end_date: "2024-08-30",
      sport_type: "Basketball",
      status: "upcoming",
      max_teams: 12,
      registration_deadline: "2024-03-15",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];
}

function saveCompetitionsToStorage(competitions: Competition[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      COMPETITION_STORAGE_KEY,
      JSON.stringify({
        competitions,
        lastUpdated: new Date().toISOString(),
      }),
    );
  }
}

let competitions: Competition[] = loadCompetitionsFromStorage();

// Simple delay to simulate network
const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class CompetitionServiceClass {
  async get_all_competitions(): Promise<Competition[]> {
    await delay();
    return [...competitions];
  }

  async get_competitions_by_organization(
    organization_id: string,
  ): Promise<Competition[]> {
    await delay();
    return competitions.filter((c) => c.organization_id === organization_id);
  }

  async get_competition_by_id(id: string): Promise<Competition> {
    await delay();
    const comp = competitions.find((c) => c.id === id);
    if (!comp) throw new Error(`Competition ${id} not found`);
    return { ...comp };
  }

  async create_competition(data: CreateCompetitionData): Promise<Competition> {
    await delay();

    const now = new Date().toISOString();
    const newComp: Competition = {
      id: Date.now().toString(),
      ...data,
      created_at: now,
      updated_at: now,
    };

    competitions.push(newComp);
    saveCompetitionsToStorage(competitions);
    return { ...newComp };
  }

  async update_competition(
    id: string,
    data: Partial<CreateCompetitionData>,
  ): Promise<Competition> {
    await delay();

    const index = competitions.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Competition ${id} not found`);

    const updated = {
      ...competitions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    competitions[index] = updated;
    saveCompetitionsToStorage(competitions);
    return { ...updated };
  }

  async delete_competition(id: string): Promise<boolean> {
    await delay();

    const index = competitions.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Competition ${id} not found`);

    competitions.splice(index, 1);
    saveCompetitionsToStorage(competitions);
    return true;
  }

  validate_competition_data(data: CreateCompetitionData) {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.organization_id?.trim())
      errors.organization_id = "Organization is required";
    if (!data.start_date) errors.start_date = "Start date is required";
    if (!data.end_date) errors.end_date = "End date is required";
    if (data.max_teams < 2) errors.max_teams = "At least 2 teams required";

    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  get_status_badge_class(status: Competition["status"]): string {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }
}

export const competitionService = new CompetitionServiceClass();
