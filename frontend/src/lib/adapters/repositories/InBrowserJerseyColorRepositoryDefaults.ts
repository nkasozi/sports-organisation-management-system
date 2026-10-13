import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { ScalarInput } from "../../core/types/DomainScalars";

const DEFAULT_JERSEY_COLORS_SEEDS: Omit<
  ScalarInput<JerseyColor>,
  "created_at" | "updated_at"
>[] = [
  {
    id: "jersey_default_home",
    holder_type: "team",
    holder_id: "team_default_1",
    nickname: "Home Kit",
    main_color: "#1E40AF",
    secondary_color: "#FFFFFF",
    tertiary_color: "#F59E0B",
    status: "active",
  },
  {
    id: "jersey_default_away",
    holder_type: "team",
    holder_id: "team_default_1",
    nickname: "Away Kit",
    main_color: "#FFFFFF",
    secondary_color: "#1E40AF",
    tertiary_color: "#F59E0B",
    status: "active",
  },
  {
    id: "jersey_default_official_1",
    holder_type: "competition_official",
    holder_id: "comp_default_1",
    nickname: "Official Uniform",
    main_color: "#000000",
    secondary_color: "#FFFFFF",
    tertiary_color: "",
    status: "active",
  },
  {
    id: "jersey_default_official_2",
    holder_type: "competition_official",
    holder_id: "comp_default_2",
    nickname: "Official Uniform",
    main_color: "#1F2937",
    secondary_color: "#FFFFFF",
    tertiary_color: "",
    status: "active",
  },
  {
    id: "jersey_default_official_3",
    holder_type: "competition_official",
    holder_id: "comp_default_3",
    nickname: "Official Uniform",
    main_color: "#6B7280",
    secondary_color: "#1F2937",
    tertiary_color: "",
    status: "active",
  },
  {
    id: "jersey_default_official_4",
    holder_type: "competition_official",
    holder_id: "comp_default_4",
    nickname: "Official Uniform",
    main_color: "#FFFFFF",
    secondary_color: "#1F2937",
    tertiary_color: "",
    status: "active",
  },
];

export function create_default_jersey_colors(): ScalarInput<JerseyColor>[] {
  const now = new Date().toISOString();
  return DEFAULT_JERSEY_COLORS_SEEDS.map(
    (seed) =>
      ({
        ...seed,
        created_at: now,
        updated_at: now,
      }) as ScalarInput<JerseyColor>,
  );
}
