// In-memory data store for the sports management system
// This provides a centralized state management solution for development and testing

export interface Organization {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  founded_date: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  competition_type:
    | "tournament"
    | "league"
    | "meet"
    | "championship"
    | "friendly";
  organization_id: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
  rules: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status: "upcoming" | "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface CompetitionConstraint {
  id: string;
  competition_id: string;
  constraint_type: "player" | "team" | "game" | "match" | "general";
  name: string;
  description: string;
  value_type: "number" | "boolean" | "string" | "duration" | "list";
  value: any;
  is_mandatory: boolean;
  applies_to: string; // JSON string describing what this applies to
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  organization_id: string;
  competition_id: string | null;
  coach_name: string;
  coach_email: string | null;
  coach_phone: string | null;
  max_players: number;
  practice_schedule: string | null;
  home_venue: string | null;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  position: string | null;
  jersey_number: number | null;
  team_id: string;
  height: string | null;
  weight: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string | null;
  status: "active" | "injured" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Umpire {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  certification_level: string;
  sport_types: string[]; // Sports they can officiate
  years_experience: number;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  status:
    | "scheduled"
    | "in_progress"
    | "paused"
    | "completed"
    | "cancelled"
    | "postponed";
  home_score: number;
  away_score: number;
  current_period: number;
  period_time_remaining: number; // in seconds
  main_umpire_id: string | null;
  assistant_umpire_ids: string[];
  actual_start_time: string | null;
  actual_end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameEvent {
  id: string;
  game_id: string;
  event_type:
    | "goal"
    | "card"
    | "substitution"
    | "timeout"
    | "period_start"
    | "period_end"
    | "game_start"
    | "game_end"
    | "pause"
    | "resume";
  period: number;
  time_in_period: number; // seconds elapsed in current period
  team_id: string | null;
  player_id: string | null;
  umpire_id: string | null;
  event_data: any; // JSON object with event-specific data
  description: string;
  created_at: string;
}

// In-memory store class
class InMemoryStore {
  private organizations: Map<string, Organization> = new Map();
  private competitions: Map<string, Competition> = new Map();
  private competition_constraints: Map<string, CompetitionConstraint> =
    new Map();
  private teams: Map<string, Team> = new Map();
  private players: Map<string, Player> = new Map();
  private umpires: Map<string, Umpire> = new Map();
  private games: Map<string, Game> = new Map();
  private game_events: Map<string, GameEvent> = new Map();

  constructor() {
    this.seed_initial_data();
  }

  // Utility methods
  private generate_id(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private get_current_timestamp(): string {
    return new Date().toISOString();
  }

  // Organizations CRUD
  create_organization(
    data: Omit<Organization, "id" | "created_at" | "updated_at">,
  ): Organization {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const organization: Organization = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.organizations.set(id, organization);
    return organization;
  }

  get_all_organizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  get_organization_by_id(id: string): Organization | null {
    return this.organizations.get(id) || null;
  }

  update_organization(
    id: string,
    data: Partial<Organization>,
  ): Organization | null {
    const existing = this.organizations.get(id);
    if (!existing) return null;

    const updated: Organization = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.organizations.set(id, updated);
    return updated;
  }

  delete_organization(id: string): boolean {
    return this.organizations.delete(id);
  }

  // Competitions CRUD
  create_competition(
    data: Omit<Competition, "id" | "created_at" | "updated_at">,
  ): Competition {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const competition: Competition = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.competitions.set(id, competition);
    return competition;
  }

  get_all_competitions(): Competition[] {
    return Array.from(this.competitions.values());
  }

  get_competitions_by_organization(organization_id: string): Competition[] {
    return Array.from(this.competitions.values()).filter(
      (comp) => comp.organization_id === organization_id,
    );
  }

  get_competition_by_id(id: string): Competition | null {
    return this.competitions.get(id) || null;
  }

  update_competition(
    id: string,
    data: Partial<Competition>,
  ): Competition | null {
    const existing = this.competitions.get(id);
    if (!existing) return null;

    const updated: Competition = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.competitions.set(id, updated);
    return updated;
  }

  delete_competition(id: string): boolean {
    return this.competitions.delete(id);
  }

  // Competition Constraints CRUD
  create_competition_constraint(
    data: Omit<CompetitionConstraint, "id" | "created_at" | "updated_at">,
  ): CompetitionConstraint {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const constraint: CompetitionConstraint = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.competition_constraints.set(id, constraint);
    return constraint;
  }

  get_constraints_by_competition(
    competition_id: string,
  ): CompetitionConstraint[] {
    return Array.from(this.competition_constraints.values()).filter(
      (constraint) => constraint.competition_id === competition_id,
    );
  }

  get_constraint_by_id(id: string): CompetitionConstraint | null {
    return this.competition_constraints.get(id) || null;
  }

  update_competition_constraint(
    id: string,
    data: Partial<CompetitionConstraint>,
  ): CompetitionConstraint | null {
    const existing = this.competition_constraints.get(id);
    if (!existing) return null;

    const updated: CompetitionConstraint = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.competition_constraints.set(id, updated);
    return updated;
  }

  delete_competition_constraint(id: string): boolean {
    return this.competition_constraints.delete(id);
  }

  // Teams CRUD
  create_team(data: Omit<Team, "id" | "created_at" | "updated_at">): Team {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const team: Team = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.teams.set(id, team);
    return team;
  }

  get_all_teams(): Team[] {
    return Array.from(this.teams.values());
  }

  get_teams_by_competition(competition_id: string): Team[] {
    return Array.from(this.teams.values()).filter(
      (team) => team.competition_id === competition_id,
    );
  }

  get_team_by_id(id: string): Team | null {
    return this.teams.get(id) || null;
  }

  update_team(id: string, data: Partial<Team>): Team | null {
    const existing = this.teams.get(id);
    if (!existing) return null;

    const updated: Team = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.teams.set(id, updated);
    return updated;
  }

  delete_team(id: string): boolean {
    return this.teams.delete(id);
  }

  // Players CRUD
  create_player(
    data: Omit<Player, "id" | "created_at" | "updated_at">,
  ): Player {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const player: Player = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.players.set(id, player);
    return player;
  }

  get_all_players(): Player[] {
    return Array.from(this.players.values());
  }

  get_players_by_team(team_id: string): Player[] {
    return Array.from(this.players.values()).filter(
      (player) => player.team_id === team_id,
    );
  }

  get_player_by_id(id: string): Player | null {
    return this.players.get(id) || null;
  }

  update_player(id: string, data: Partial<Player>): Player | null {
    const existing = this.players.get(id);
    if (!existing) return null;

    const updated: Player = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.players.set(id, updated);
    return updated;
  }

  delete_player(id: string): boolean {
    return this.players.delete(id);
  }

  // Umpires CRUD
  create_umpire(
    data: Omit<Umpire, "id" | "created_at" | "updated_at">,
  ): Umpire {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const umpire: Umpire = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.umpires.set(id, umpire);
    return umpire;
  }

  get_all_umpires(): Umpire[] {
    return Array.from(this.umpires.values());
  }

  get_umpires_by_sport(sport_type: string): Umpire[] {
    return Array.from(this.umpires.values()).filter(
      (umpire) =>
        umpire.sport_types.includes(sport_type) && umpire.status === "active",
    );
  }

  get_umpire_by_id(id: string): Umpire | null {
    return this.umpires.get(id) || null;
  }

  update_umpire(id: string, data: Partial<Umpire>): Umpire | null {
    const existing = this.umpires.get(id);
    if (!existing) return null;

    const updated: Umpire = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.umpires.set(id, updated);
    return updated;
  }

  delete_umpire(id: string): boolean {
    return this.umpires.delete(id);
  }

  // Games CRUD
  create_game(data: Omit<Game, "id" | "created_at" | "updated_at">): Game {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const game: Game = {
      ...data,
      id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.games.set(id, game);
    return game;
  }

  get_all_games(): Game[] {
    return Array.from(this.games.values());
  }

  get_games_by_competition(competition_id: string): Game[] {
    return Array.from(this.games.values()).filter(
      (game) => game.competition_id === competition_id,
    );
  }

  get_game_by_id(id: string): Game | null {
    return this.games.get(id) || null;
  }

  update_game(id: string, data: Partial<Game>): Game | null {
    const existing = this.games.get(id);
    if (!existing) return null;

    const updated: Game = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.get_current_timestamp(),
    };

    this.games.set(id, updated);
    return updated;
  }

  delete_game(id: string): boolean {
    return this.games.delete(id);
  }

  // Game Events CRUD
  create_game_event(data: Omit<GameEvent, "id" | "created_at">): GameEvent {
    const id = this.generate_id();
    const timestamp = this.get_current_timestamp();

    const event: GameEvent = {
      ...data,
      id,
      created_at: timestamp,
    };

    this.game_events.set(id, event);
    return event;
  }

  get_events_by_game(game_id: string): GameEvent[] {
    return Array.from(this.game_events.values())
      .filter((event) => event.game_id === game_id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }

  get_game_event_by_id(id: string): GameEvent | null {
    return this.game_events.get(id) || null;
  }

  delete_game_event(id: string): boolean {
    return this.game_events.delete(id);
  }

  // Seed initial data for testing
  private seed_initial_data(): void {
    // Create sample organization
    const sample_org = this.create_organization({
      name: "Downtown Sports Club",
      description: "Premier sports organization in the downtown area",
      sport_type: "multi-sport",
      founded_date: "2020-01-15",
      contact_email: "admin@downtownsports.com",
      contact_phone: "+1 (555) 123-4567",
      address: "123 Main Street, Downtown, NY 10001",
      website: "https://www.downtownsports.com",
      status: "active",
    });

    // Create sample umpires
    this.create_umpire({
      first_name: "John",
      last_name: "Referee",
      email: "john.referee@example.com",
      phone: "+1 (555) 987-6543",
      certification_level: "Level 3",
      sport_types: ["football", "basketball"],
      years_experience: 8,
      status: "active",
    });

    this.create_umpire({
      first_name: "Sarah",
      last_name: "Official",
      email: "sarah.official@example.com",
      phone: "+1 (555) 456-7890",
      certification_level: "Level 2",
      sport_types: ["football", "tennis"],
      years_experience: 5,
      status: "active",
    });

    console.log("In-memory store initialized with sample data");
  }

  // Utility methods for data relationships
  get_team_with_players(
    team_id: string,
  ): (Team & { players: Player[] }) | null {
    const team = this.get_team_by_id(team_id);
    if (!team) return null;

    const players = this.get_players_by_team(team_id);
    return { ...team, players };
  }

  get_competition_with_teams(
    competition_id: string,
  ): (Competition & { teams: Team[] }) | null {
    const competition = this.get_competition_by_id(competition_id);
    if (!competition) return null;

    const teams = this.get_teams_by_competition(competition_id);
    return { ...competition, teams };
  }

  get_game_with_events(
    game_id: string,
  ): (Game & { events: GameEvent[] }) | null {
    const game = this.get_game_by_id(game_id);
    if (!game) return null;

    const events = this.get_events_by_game(game_id);
    return { ...game, events };
  }

  // Clear all data (useful for testing)
  clear_all_data(): void {
    this.organizations.clear();
    this.competitions.clear();
    this.competition_constraints.clear();
    this.teams.clear();
    this.players.clear();
    this.umpires.clear();
    this.games.clear();
    this.game_events.clear();
  }
}

// Export singleton instance
export const memoryStore = new InMemoryStore();
