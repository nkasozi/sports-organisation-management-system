import type { Team } from "../../../core/entities/Team";
import { DEFAULT_TEAM_LOGO } from "../../../core/entities/Team";
import {
  generate_current_timestamp,
  SEED_GENDER_IDS,
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
} from "./seedIds";
import { SEED_PLAYER_IDS } from "./seedPlayerIds";

export function create_seed_teams_women(
  lugogo_stadium_id: string,
  kyambogo_pitch_id: string,
  makerere_ground_id: string,
  entebbe_club_id: string,
  jinja_ground_id: string,
): Team[] {
  const now = generate_current_timestamp();

  return [
    {
      id: SEED_TEAM_IDS.WEATHERHEAD_HC_WOMEN,
      name: "Weatherhead HC Ladies",
      short_name: "WHL",
      description:
        "Women's section of Weatherhead Hockey Club, competing at the highest level of women's hockey",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      gender_id: SEED_GENDER_IDS.FEMALE,
      captain_player_id: SEED_PLAYER_IDS.WEATHERHEAD_P6,
      vice_captain_player_id: SEED_PLAYER_IDS.WEATHERHEAD_P8,
      max_squad_size: 18,
      home_venue_id: lugogo_stadium_id,
      primary_color: "#1E3A8A",
      secondary_color: "#FBBF24",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://weatherheadhc.ug/ladies",
      founded_year: 1972,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_IDS.KAMPALA_HC_WOMEN,
      name: "Kampala HC Ladies",
      short_name: "KHL",
      description:
        "Women's section of Kampala Hockey Club with a proud tradition of developing female talent",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      gender_id: SEED_GENDER_IDS.FEMALE,
      captain_player_id: SEED_PLAYER_IDS.JUDITH_NAKATO,
      vice_captain_player_id: SEED_PLAYER_IDS.KAMPALA_P7,
      max_squad_size: 18,
      home_venue_id: lugogo_stadium_id,
      primary_color: "#DC2626",
      secondary_color: "#FDF2F8",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://kampalahc.ug/ladies",
      founded_year: 1980,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_IDS.WANANCHI_HC_WOMEN,
      name: "Wananchi HC Ladies",
      short_name: "WNL",
      description:
        "Women's section of Wananchi HC, championing community hockey for women across Uganda",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      gender_id: SEED_GENDER_IDS.FEMALE,
      captain_player_id: SEED_PLAYER_IDS.MAKERERE_P7,
      vice_captain_player_id: SEED_PLAYER_IDS.MAKERERE_P9,
      max_squad_size: 18,
      home_venue_id: jinja_ground_id,
      primary_color: "#16A34A",
      secondary_color: "#D1FAE5",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://wananchihc.ug/ladies",
      founded_year: 1990,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: SEED_TEAM_IDS.ROCKETS_HC_WOMEN,
      name: "Rockets HC Ladies",
      short_name: "RHL",
      description:
        "Women's section of Rockets HC, known for fast-paced attacking women's hockey",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      gender_id: SEED_GENDER_IDS.FEMALE,
      captain_player_id: SEED_PLAYER_IDS.SHARON_NABATANZI,
      vice_captain_player_id: SEED_PLAYER_IDS.STRIKERS_P11,
      max_squad_size: 18,
      home_venue_id: entebbe_club_id,
      primary_color: "#F59E0B",
      secondary_color: "#FEF3C7",
      logo_url: DEFAULT_TEAM_LOGO,
      website: "https://rocketshc.ug/ladies",
      founded_year: 1998,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}
