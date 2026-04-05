import type { Team } from "../../core/entities/Team";
import { DEFAULT_TEAM_LOGO } from "../../core/entities/Team";

export function create_default_teams(): Team[] {
  const now = new Date().toISOString();
  const BASE = {
    organization_id: "org_default_1",
    gender_id: "",
    captain_player_id: null,
    vice_captain_player_id: null,
    logo_url: DEFAULT_TEAM_LOGO,
    status: "active" as const,
    created_at: now,
    updated_at: now,
  };

  return [
    {
      ...BASE,
      id: "team_default_1",
      name: "Weatherhead Hockey Club",
      short_name: "WHC",
      description:
        "One of Uganda's most prestigious field hockey clubs, known for technical excellence and youth development",
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#1E3A8A",
      secondary_color: "#FFFFFF",
      website: "https://weatherheadhc.ug",
      founded_year: 1985,
    },
    {
      ...BASE,
      id: "team_default_2",
      name: "Kampala Hockey Club",
      short_name: "KHC",
      description:
        "Founding member of the Uganda Hockey Association with a rich history and passionate supporter base",
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#DC2626",
      secondary_color: "#FBBF24",
      website: "https://kampalahc.ug",
      founded_year: 1972,
    },
    {
      ...BASE,
      id: "team_default_3",
      name: "Rockets Hockey Club",
      short_name: "RHC",
      description:
        "Dynamic hockey club known for fast-paced attacking play and team spirit",
      max_squad_size: 25,
      home_venue_id: "venue_default_4",
      primary_color: "#F59E0B",
      secondary_color: "#1F2937",
      website: "https://rocketshc.ug",
      founded_year: 1998,
    },
    {
      ...BASE,
      id: "team_default_4",
      name: "Wananchi Hockey Club",
      short_name: "WAN",
      description:
        "Grassroots hockey club committed to making hockey accessible to all Ugandans",
      max_squad_size: 25,
      home_venue_id: "venue_default_5",
      primary_color: "#16A34A",
      secondary_color: "#FFFFFF",
      website: "https://wananchihc.ug",
      founded_year: 2005,
    },
    {
      ...BASE,
      id: "team_default_5",
      name: "Makerere University Hockey Club",
      short_name: "MAK",
      description:
        "Elite university hockey team combining academic excellence with sporting prowess",
      max_squad_size: 22,
      home_venue_id: "venue_default_3",
      primary_color: "#7C3AED",
      secondary_color: "#F3E8FF",
      website: "https://mak.ac.ug/hockey",
      founded_year: 1980,
    },
    {
      ...BASE,
      id: "team_default_6",
      name: "Kyambogo University Hockey Club",
      short_name: "KYU",
      description:
        "Rising force in Ugandan university hockey with strong support and excellent facilities",
      max_squad_size: 22,
      home_venue_id: "venue_default_2",
      primary_color: "#0891B2",
      secondary_color: "#ECFEFF",
      website: "https://kyu.ac.ug/hockey",
      founded_year: 2002,
    },
    {
      ...BASE,
      id: "team_default_7",
      name: "Simba Hockey Club",
      short_name: "SIM",
      description:
        "Fierce competitors known for disciplined defense and tactical awareness",
      max_squad_size: 25,
      home_venue_id: "venue_default_5",
      primary_color: "#EA580C",
      secondary_color: "#1F2937",
      website: "https://simbahc.ug",
      founded_year: 2010,
    },
    {
      ...BASE,
      id: "team_default_8",
      name: "Strikers Hockey Club",
      short_name: "STR",
      description:
        "Goal-scoring specialists known for entertaining attacking hockey",
      max_squad_size: 25,
      home_venue_id: "venue_default_1",
      primary_color: "#DB2777",
      secondary_color: "#FDF2F8",
      website: "https://strikershc.ug",
      founded_year: 2015,
    },
  ];
}
