import type { Competition } from "../../../core/entities/Competition";
import type { ScalarInput } from "../../../core/types/DomainScalars";
import type { SeedCompetitionFormatIds } from "./seedIds";
import {
  generate_current_timestamp,
  SEED_COMPETITION_IDS,
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";

export function create_seed_competitions(
  format_ids: SeedCompetitionFormatIds,
): ScalarInput<Competition>[] {
  const now = generate_current_timestamp();
  const next_month = new Date();
  next_month.setMonth(next_month.getMonth() + 1);
  const three_months = new Date();
  three_months.setMonth(three_months.getMonth() + 3);

  return [
    {
      id: SEED_COMPETITION_IDS.EASTER_CUP_2026,
      name: "Easter Cup 2026",
      description:
        "Annual Easter hockey tournament - Uganda's most prestigious knockout competition",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_format_id: format_ids.easter_cup_format_id,
      team_ids: [
        SEED_TEAM_IDS.WEATHERHEAD_HC,
        SEED_TEAM_IDS.KAMPALA_HC,
        SEED_TEAM_IDS.ROCKETS_HC,
        SEED_TEAM_IDS.WANANCHI_HC,
        SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
        SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
        SEED_TEAM_IDS.SIMBA_HC,
        SEED_TEAM_IDS.STRIKERS_HC,
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-04-03",
      end_date: "2026-04-06",
      registration_deadline: "2026-03-25",
      max_teams: 16,
      entry_fee: 500000,
      prize_pool: 5000000,
      location: "Lugogo Hockey Stadium, Kampala",
      rule_overrides: { min_players_on_field: 1 },
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_COMPETITION_IDS.UGANDA_CUP_2026,
      name: "Uganda Cup 2026",
      description:
        "The national knockout cup competition open to all registered hockey clubs",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_format_id: format_ids.uganda_cup_format_id,
      team_ids: [
        SEED_TEAM_IDS.WEATHERHEAD_HC,
        SEED_TEAM_IDS.KAMPALA_HC,
        SEED_TEAM_IDS.ROCKETS_HC,
        SEED_TEAM_IDS.WANANCHI_HC,
        SEED_TEAM_IDS.SIMBA_HC,
        SEED_TEAM_IDS.STRIKERS_HC,
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-06-01",
      end_date: "2026-08-30",
      registration_deadline: "2026-05-15",
      max_teams: 16,
      entry_fee: 300000,
      prize_pool: 3000000,
      location: "Various Venues",
      rule_overrides: { min_players_on_field: 1 },
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_COMPETITION_IDS.NATIONAL_HOCKEY_LEAGUE_2026,
      name: "National Hockey League 2026",
      description:
        "Full season league competition - the premier hockey league in Uganda",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_format_id: format_ids.nhl_format_id,
      team_ids: [
        SEED_TEAM_IDS.WEATHERHEAD_HC,
        SEED_TEAM_IDS.KAMPALA_HC,
        SEED_TEAM_IDS.ROCKETS_HC,
        SEED_TEAM_IDS.WANANCHI_HC,
        SEED_TEAM_IDS.SIMBA_HC,
        SEED_TEAM_IDS.STRIKERS_HC,
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-02-01",
      end_date: "2026-11-30",
      registration_deadline: "2026-01-15",
      max_teams: 12,
      entry_fee: 1000000,
      prize_pool: 10000000,
      location: "Various Venues",
      rule_overrides: { min_players_on_field: 1 },
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_COMPETITION_IDS.UNIVERSITY_HOCKEY_CHAMPIONSHIP_2026,
      name: "Inter-University Hockey Championship 2026",
      description:
        "Championship competition for university hockey teams across Uganda",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      competition_format_id: format_ids.university_format_id,
      team_ids: [
        SEED_TEAM_IDS.MAKERERE_UNIVERSITY_HC,
        SEED_TEAM_IDS.KYAMBOGO_UNIVERSITY_HC,
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: next_month.toISOString().split("T")[0],
      end_date: three_months.toISOString().split("T")[0],
      registration_deadline: new Date().toISOString().split("T")[0],
      max_teams: 8,
      entry_fee: 200000,
      prize_pool: 2000000,
      location: "University Sports Grounds",
      rule_overrides: { min_players_on_field: 1 },
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}
