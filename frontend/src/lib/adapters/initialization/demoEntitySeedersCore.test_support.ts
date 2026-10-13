import { vi } from "vitest";

export const PEOPLE = [
  { id: "x1", first_name: "Ann", last_name: "Lee" },
  { id: "x2", first_name: "Bob", last_name: "Ray" },
];
export const NAMED = [{ id: "n1", name: "Alpha", competition_id: "c1" }];
export const VENUES = ["v1", "v2", "v3", "v4", "v5"].map((id) => ({
  id,
  name: id,
}));
export const LOOKUPS = {
  head_coach_role_id: "hc",
  assistant_coach_role_id: "ac",
  physio_role_id: "ph",
  team_manager_role_id: "tm",
  competition_format_ids: { league: "f1" },
} as never;
export const VENUE_IDS = {
  dragon_stadium_id: "v1",
  thunder_arena_id: "v2",
  eagle_nest_id: "v3",
  storm_center_id: "v4",
  international_hockey_arena_id: "v5",
};

export function repository(result: unknown): never {
  return { seed_with_data: vi.fn().mockResolvedValue(result) } as never;
}

export const OK = { success: true, data: 1 };
export const FAIL = { success: false, error: "disk full" };
