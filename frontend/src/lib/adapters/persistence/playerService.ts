// Simple player service
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  position: string;
  jersey_number: number;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
  status: "active" | "injured" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreatePlayerData {
  first_name: string;
  last_name: string;
  team_id: string;
  position: string;
  jersey_number: number;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
  status: "active" | "injured" | "suspended" | "inactive";
}

let players: Player[] = [
  {
    id: "1",
    first_name: "Mike",
    last_name: "Johnson",
    team_id: "1",
    position: "Forward",
    jersey_number: 10,
    date_of_birth: "1995-05-15",
    email: "mike.johnson@email.com",
    phone: "+1-555-0101",
    address: "123 Main St, City",
    emergency_contact: "Jane Johnson - +1-555-0102",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class PlayerServiceClass {
  async get_all_players(): Promise<Player[]> {
    await delay();
    return [...players];
  }

  async get_players_by_team(team_id: string): Promise<Player[]> {
    await delay();
    return players.filter((p) => p.team_id === team_id);
  }

  async get_player_by_id(id: string): Promise<Player> {
    await delay();
    const player = players.find((p) => p.id === id);
    if (!player) throw new Error(`Player ${id} not found`);
    return { ...player };
  }

  async create_player(data: CreatePlayerData): Promise<Player> {
    await delay();
    const now = new Date().toISOString();
    const newPlayer: Player = {
      id: Date.now().toString(),
      ...data,
      created_at: now,
      updated_at: now,
    };
    players.push(newPlayer);
    return { ...newPlayer };
  }

  async update_player(
    id: string,
    data: Partial<CreatePlayerData>,
  ): Promise<Player> {
    await delay();
    const index = players.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Player ${id} not found`);
    const updated = {
      ...players[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    players[index] = updated;
    return { ...updated };
  }

  async delete_player(id: string): Promise<boolean> {
    await delay();
    const index = players.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Player ${id} not found`);
    players.splice(index, 1);
    return true;
  }
}

export const playerService = new PlayerServiceClass();
