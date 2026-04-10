import type { JerseyColorAssignment } from "./FixtureTypes";

interface ColorClashWarning {
  party_a: string;
  party_b: string;
  color: string;
  delta_e: number;
  message: string;
}

const COLOR_SIMILARITY_THRESHOLD = 25;

function extract_hex(color: string): string {
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith("#")) return trimmed;
  if (/^[a-f0-9]{6}$/i.test(trimmed)) return `#${trimmed}`;
  if (/^[a-f0-9]{3}$/i.test(trimmed)) return `#${trimmed}`;
  return color;
}

function hex_to_lab(hex: string): { l: number; a: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "").trim();
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;

  let full_hex = cleaned;
  if (cleaned.length === 3) {
    full_hex =
      cleaned[0] +
      cleaned[0] +
      cleaned[1] +
      cleaned[1] +
      cleaned[2] +
      cleaned[2];
  }

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full_hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b_val = parseInt(result[3], 16) / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b_val =
    b_val > 0.04045 ? Math.pow((b_val + 0.055) / 1.055, 2.4) : b_val / 12.92;

  r *= 100;
  g *= 100;
  b_val *= 100;

  const x = r * 0.4124564 + g * 0.3575761 + b_val * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b_val * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b_val * 0.9503041;

  let lab_x = x / 95.047;
  let lab_y = y / 100.0;
  let lab_z = z / 108.883;

  lab_x = lab_x > 0.008856 ? Math.pow(lab_x, 1 / 3) : 7.787 * lab_x + 16 / 116;
  lab_y = lab_y > 0.008856 ? Math.pow(lab_y, 1 / 3) : 7.787 * lab_y + 16 / 116;
  lab_z = lab_z > 0.008856 ? Math.pow(lab_z, 1 / 3) : 7.787 * lab_z + 16 / 116;

  return {
    l: 116 * lab_y - 16,
    a: 500 * (lab_x - lab_y),
    b: 200 * (lab_y - lab_z),
  };
}

function calculate_delta_e(color_a: string, color_b: string): number | null {
  const hex_a = extract_hex(color_a);
  const hex_b = extract_hex(color_b);
  const lab_a = hex_to_lab(hex_a);
  const lab_b = hex_to_lab(hex_b);
  if (!lab_a || !lab_b) return null;

  const delta_l = lab_a.l - lab_b.l;
  const delta_a = lab_a.a - lab_b.a;
  const delta_b = lab_a.b - lab_b.b;
  return Math.sqrt(delta_l * delta_l + delta_a * delta_a + delta_b * delta_b);
}

function colors_are_similar(
  color_a: string | undefined,
  color_b: string | undefined,
): { similar: boolean; delta_e: number } {
  if (!color_a || !color_b) return { similar: false, delta_e: 100 };
  const delta_e = calculate_delta_e(color_a, color_b);
  if (delta_e === null) return { similar: false, delta_e: 100 };
  return { similar: delta_e < COLOR_SIMILARITY_THRESHOLD, delta_e };
}

function get_similarity_description(delta_e: number): string {
  if (delta_e < 5) return "nearly identical";
  if (delta_e < 15) return "very similar";
  return "similar";
}

function check_color_pair(
  jersey_a: JerseyColorAssignment | undefined,
  jersey_b: JerseyColorAssignment | undefined,
  name_a: string,
  name_b: string,
): ColorClashWarning | null {
  if (!jersey_a || !jersey_b) return null;
  const result = colors_are_similar(jersey_a.main_color, jersey_b.main_color);
  if (!result.similar) return null;

  const similarity = get_similarity_description(result.delta_e);
  return {
    party_a: name_a,
    party_b: name_b,
    color: jersey_a.main_color,
    delta_e: result.delta_e,
    message: `${name_a} and ${name_b} have ${similarity} jersey colors (Delta E: ${result.delta_e.toFixed(1)})`,
  };
}

export function detect_jersey_color_clashes(
  home_team_jersey: JerseyColorAssignment | undefined,
  away_team_jersey: JerseyColorAssignment | undefined,
  officials_jersey: JerseyColorAssignment | undefined,
  home_team_name: string,
  away_team_name: string,
): ColorClashWarning[] {
  const warnings: ColorClashWarning[] = [];

  const home_away = check_color_pair(
    home_team_jersey,
    away_team_jersey,
    home_team_name,
    away_team_name,
  );
  if (home_away) warnings.push(home_away);

  const home_officials = check_color_pair(
    home_team_jersey,
    officials_jersey,
    home_team_name,
    "Officials",
  );
  if (home_officials) warnings.push(home_officials);

  const away_officials = check_color_pair(
    away_team_jersey,
    officials_jersey,
    away_team_name,
    "Officials",
  );
  if (away_officials) warnings.push(away_officials);

  return warnings;
}

export function has_color_clashes(
  home_team_jersey: JerseyColorAssignment | undefined,
  away_team_jersey: JerseyColorAssignment | undefined,
  officials_jersey: JerseyColorAssignment | undefined,
  home_team_name: string,
  away_team_name: string,
): boolean {
  return (
    detect_jersey_color_clashes(
      home_team_jersey,
      away_team_jersey,
      officials_jersey,
      home_team_name,
      away_team_name,
    ).length > 0
  );
}
