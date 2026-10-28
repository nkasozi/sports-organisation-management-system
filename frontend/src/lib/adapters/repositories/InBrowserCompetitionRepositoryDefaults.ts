import type { Competition } from "../../core/entities/Competition";
import type { ScalarInput } from "../../core/types/DomainScalars";

type DefaultCompetitionRow = Omit<
  ScalarInput<Competition>,
  "created_at" | "updated_at"
>;

const DEFAULT_COMPETITION_BASE = {
  organization_id: "org_default_1",
  allow_auto_squad_submission: true,
  allow_auto_fixture_details_setup: true,
  squad_generation_strategy: "first_available" as const,
  lineup_submission_deadline_hours: 2,
  max_event_edits_per_game: 3,
  status: "active" as const,
  rule_overrides: {},
  competition_format_id: "format_standard_league",
};
const DEFAULT_COMPETITION_ALL_TEAMS = [
  "team_default_1",
  "team_default_2",
  "team_default_3",
  "team_default_4",
  "team_default_5",
  "team_default_6",
  "team_default_7",
  "team_default_8",
];
const DEFAULT_COMPETITION_SIX_TEAMS = DEFAULT_COMPETITION_ALL_TEAMS.slice(0, 6);
const DEFAULT_COMPETITION_UNI_TEAMS = ["team_default_5", "team_default_6"];

const DEFAULT_COMPETITION_ROWS: DefaultCompetitionRow[] = [
  {
    ...DEFAULT_COMPETITION_BASE,
    id: "comp_default_1",
    name: "Easter Cup 2026",
    description:
      "Annual Easter hockey tournament - Uganda's most prestigious knockout competition",
    team_ids: DEFAULT_COMPETITION_ALL_TEAMS,
    start_date: "2026-04-03",
    end_date: "2026-04-06",
    registration_deadline: "2026-03-25",
    max_teams: 16,
    entry_fee: 500000,
    prize_pool: 5000000,
    location: "Lugogo Hockey Stadium, Kampala",
  },
  {
    ...DEFAULT_COMPETITION_BASE,
    id: "comp_default_2",
    name: "Uganda Cup 2026",
    description:
      "The national knockout cup competition open to all registered hockey clubs",
    team_ids: DEFAULT_COMPETITION_SIX_TEAMS,
    start_date: "2026-06-01",
    end_date: "2026-08-30",
    registration_deadline: "2026-05-15",
    max_teams: 16,
    entry_fee: 300000,
    prize_pool: 3000000,
    location: "Various Venues",
  },
  {
    ...DEFAULT_COMPETITION_BASE,
    id: "comp_default_3",
    name: "National Hockey League 2026",
    description:
      "Full season league competition - the premier hockey league in Uganda",
    team_ids: DEFAULT_COMPETITION_SIX_TEAMS,
    start_date: "2026-02-01",
    end_date: "2026-11-30",
    registration_deadline: "2026-01-15",
    max_teams: 12,
    entry_fee: 1000000,
    prize_pool: 10000000,
    location: "Various Venues",
  },
  {
    ...DEFAULT_COMPETITION_BASE,
    id: "comp_default_4",
    name: "Inter-University Hockey Championship 2026",
    description:
      "Annual championship for university hockey teams across Uganda",
    team_ids: DEFAULT_COMPETITION_UNI_TEAMS,
    start_date: "2026-02-15",
    end_date: "2026-03-15",
    registration_deadline: "2026-02-01",
    max_teams: 8,
    entry_fee: 200000,
    prize_pool: 2000000,
    location: "Makerere Hockey Ground",
  },
];

export function create_default_competitions(): ScalarInput<Competition>[] {
  const now = new Date().toISOString();
  return DEFAULT_COMPETITION_ROWS.map(
    (row) =>
      ({
        ...row,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<Competition>,
  );
}
