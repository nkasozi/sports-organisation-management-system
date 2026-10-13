type LabColor = {
  l: number;
  a: number;
  b: number;
};

export const COLOR_PARSE_STATUS = {
  VALID: "valid",
  INVALID: "invalid",
} as const;

type LabColorResult =
  | { status: typeof COLOR_PARSE_STATUS.VALID; lab_color: LabColor }
  | { status: typeof COLOR_PARSE_STATUS.INVALID };

type DeltaEResult =
  | { status: typeof COLOR_PARSE_STATUS.VALID; delta_e: number }
  | { status: typeof COLOR_PARSE_STATUS.INVALID };

const SRGB_LINEAR_THRESHOLD = 0.04045;
const LAB_PIVOT_THRESHOLD = 0.008856;
const SHORT_HEX_LENGTH = 3;
const FULL_HEX_LENGTH = 6;

export function extract_hex(color: string): string {
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith("#")) return trimmed;
  if (/^[a-f0-9]{6}$/i.test(trimmed)) return `#${trimmed}`;
  if (/^[a-f0-9]{3}$/i.test(trimmed)) return `#${trimmed}`;
  return color;
}

function expand_short_hex(cleaned: string): string {
  if (cleaned.length !== SHORT_HEX_LENGTH) return cleaned;
  return (
    cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2]
  );
}

function linearize_channel(hex_pair: string): number {
  const value = parseInt(hex_pair, 16) / 255;
  const linear =
    value > SRGB_LINEAR_THRESHOLD
      ? Math.pow((value + 0.055) / 1.055, 2.4)
      : value / 12.92;
  return linear * 100;
}

function pivot_lab_component(value: number): number {
  return value > LAB_PIVOT_THRESHOLD
    ? Math.pow(value, 1 / 3)
    : 7.787 * value + 16 / 116;
}

function linear_rgb_to_lab(r: number, g: number, b_val: number): LabColor {
  const x = r * 0.4124564 + g * 0.3575761 + b_val * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b_val * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b_val * 0.9503041;
  const lab_x = pivot_lab_component(x / 95.047);
  const lab_y = pivot_lab_component(y / 100.0);
  const lab_z = pivot_lab_component(z / 108.883);
  return {
    l: 116 * lab_y - 16,
    a: 500 * (lab_x - lab_y),
    b: 200 * (lab_y - lab_z),
  };
}

export function hex_to_lab(hex: string): LabColorResult {
  const cleaned = hex.replace(/^#/, "").trim();
  if (
    cleaned.length !== FULL_HEX_LENGTH &&
    cleaned.length !== SHORT_HEX_LENGTH
  ) {
    return { status: COLOR_PARSE_STATUS.INVALID };
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    expand_short_hex(cleaned),
  );
  if (!result) return { status: COLOR_PARSE_STATUS.INVALID };
  return {
    status: COLOR_PARSE_STATUS.VALID,
    lab_color: linear_rgb_to_lab(
      linearize_channel(result[1]),
      linearize_channel(result[2]),
      linearize_channel(result[3]),
    ),
  };
}

export function calculate_delta_e(
  color_a: string,
  color_b: string,
): DeltaEResult {
  const lab_a = hex_to_lab(extract_hex(color_a));
  const lab_b = hex_to_lab(extract_hex(color_b));
  if (
    lab_a.status === COLOR_PARSE_STATUS.INVALID ||
    lab_b.status === COLOR_PARSE_STATUS.INVALID
  ) {
    return { status: COLOR_PARSE_STATUS.INVALID };
  }
  const delta_l = lab_a.lab_color.l - lab_b.lab_color.l;
  const delta_a = lab_a.lab_color.a - lab_b.lab_color.a;
  const delta_b = lab_a.lab_color.b - lab_b.lab_color.b;
  return {
    status: COLOR_PARSE_STATUS.VALID,
    delta_e: Math.sqrt(
      delta_l * delta_l + delta_a * delta_a + delta_b * delta_b,
    ),
  };
}
