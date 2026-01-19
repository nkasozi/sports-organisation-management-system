// Simple constraint service for competition rules
export interface CompetitionConstraint {
  id: string;
  competition_id: string;
  constraint_type: "game" | "player" | "team" | "match";
  name: string;
  description: string;
  value_type: "number" | "boolean" | "string" | "duration" | "list";
  value: any;
  is_mandatory: boolean;
  applies_to: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConstraintData {
  competition_id: string;
  constraint_type: "game" | "player" | "team" | "match";
  name: string;
  description: string;
  value_type: "number" | "boolean" | "string" | "duration" | "list";
  value: any;
  is_mandatory: boolean;
  applies_to: string;
}

// localStorage persistence
const CONSTRAINT_STORAGE_KEY = "sports_constraints_data";

function loadConstraintsFromStorage(): CompetitionConstraint[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(CONSTRAINT_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        return data.constraints || getDefaultConstraints();
      } catch (e) {
        console.warn("Failed to parse stored constraints, using defaults");
      }
    }
  }
  return getDefaultConstraints();
}

function getDefaultConstraints(): CompetitionConstraint[] {
  return [
    {
      id: "1",
      competition_id: "1",
      constraint_type: "game",
      name: "Game Duration",
      description: "Total duration of the game in minutes",
      value_type: "duration",
      value: 90,
      is_mandatory: true,
      applies_to: "All games",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      competition_id: "1",
      constraint_type: "game",
      name: "Number of Periods",
      description: "How many periods/halves in a game",
      value_type: "number",
      value: 2,
      is_mandatory: true,
      applies_to: "All games",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      competition_id: "1",
      constraint_type: "player",
      name: "Maximum Players on Field",
      description: "Maximum number of players on field during active play",
      value_type: "number",
      value: 11,
      is_mandatory: true,
      applies_to: "Each team during game",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "4",
      competition_id: "1",
      constraint_type: "match",
      name: "Cards Available",
      description: "Types of cards umpires can issue",
      value_type: "list",
      value: ["yellow", "red"],
      is_mandatory: true,
      applies_to: "All matches",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];
}

function saveConstraintsToStorage(constraints: CompetitionConstraint[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      CONSTRAINT_STORAGE_KEY,
      JSON.stringify({
        constraints,
        lastUpdated: new Date().toISOString(),
      }),
    );
  }
}

let constraints: CompetitionConstraint[] = loadConstraintsFromStorage();

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class ConstraintServiceClass {
  async get_constraints_by_competition(
    competition_id: string,
  ): Promise<CompetitionConstraint[]> {
    await delay();
    return constraints.filter((c) => c.competition_id === competition_id);
  }

  async get_constraint_by_id(id: string): Promise<CompetitionConstraint> {
    await delay();
    const constraint = constraints.find((c) => c.id === id);
    if (!constraint) throw new Error(`Constraint ${id} not found`);
    return { ...constraint };
  }

  async create_constraint(
    data: CreateConstraintData,
  ): Promise<CompetitionConstraint> {
    await delay();

    const now = new Date().toISOString();
    const newConstraint: CompetitionConstraint = {
      id: Date.now().toString(),
      ...data,
      created_at: now,
      updated_at: now,
    };

    constraints.push(newConstraint);
    saveConstraintsToStorage(constraints);
    return { ...newConstraint };
  }

  async update_constraint(
    id: string,
    data: Partial<CreateConstraintData>,
  ): Promise<CompetitionConstraint> {
    await delay();

    const index = constraints.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Constraint ${id} not found`);

    const updated = {
      ...constraints[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    constraints[index] = updated;
    saveConstraintsToStorage(constraints);
    return { ...updated };
  }

  async delete_constraint(id: string): Promise<boolean> {
    await delay();

    const index = constraints.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Constraint ${id} not found`);

    constraints.splice(index, 1);
    saveConstraintsToStorage(constraints);
    return true;
  }
}

export const constraintService = new ConstraintServiceClass();
