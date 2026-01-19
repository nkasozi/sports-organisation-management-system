import type {
  Sport,
  CreateSportInput,
  UpdateSportInput,
  OfficialRequirement,
} from "../../core/entities/Sport";
import { validate_sport_input } from "../../core/entities/Sport";
import { inMemorySportRepository } from "../repositories/InMemorySportRepository";

export interface SportServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function get_all_sports(): Promise<SportServiceResult<Sport[]>> {
  try {
    const sports = await inMemorySportRepository.get_all();
    return { success: true, data: sports };
  } catch (error) {
    console.error("[SportService] Failed to get all sports:", error);
    return { success: false, error: "Failed to retrieve sports" };
  }
}

export async function get_sport_by_id(
  id: string,
): Promise<SportServiceResult<Sport>> {
  if (!id || id.trim() === "") {
    return { success: false, error: "Sport ID is required" };
  }

  try {
    const sport = await inMemorySportRepository.get_by_id(id);
    if (!sport) {
      return { success: false, error: `Sport with ID '${id}' not found` };
    }
    return { success: true, data: sport };
  } catch (error) {
    console.error("[SportService] Failed to get sport by ID:", error);
    return { success: false, error: "Failed to retrieve sport" };
  }
}

export async function get_sport_by_code(
  code: string,
): Promise<SportServiceResult<Sport>> {
  if (!code || code.trim() === "") {
    return { success: false, error: "Sport code is required" };
  }

  try {
    const sport = await inMemorySportRepository.get_by_code(code);
    if (!sport) {
      return { success: false, error: `Sport with code '${code}' not found` };
    }
    return { success: true, data: sport };
  } catch (error) {
    console.error("[SportService] Failed to get sport by code:", error);
    return { success: false, error: "Failed to retrieve sport" };
  }
}

export async function create_sport(
  input: CreateSportInput,
): Promise<SportServiceResult<Sport>> {
  const validation_errors = validate_sport_input(input);
  if (validation_errors.length > 0) {
    return { success: false, error: validation_errors.join(", ") };
  }

  try {
    const existing_sport = await inMemorySportRepository.get_by_code(
      input.code,
    );
    if (existing_sport) {
      return {
        success: false,
        error: `Sport with code '${input.code}' already exists`,
      };
    }

    const sport = await inMemorySportRepository.create(input);
    return { success: true, data: sport };
  } catch (error) {
    console.error("[SportService] Failed to create sport:", error);
    return { success: false, error: "Failed to create sport" };
  }
}

export async function update_sport(
  id: string,
  input: UpdateSportInput,
): Promise<SportServiceResult<Sport>> {
  if (!id || id.trim() === "") {
    return { success: false, error: "Sport ID is required" };
  }

  try {
    const existing_sport = await inMemorySportRepository.get_by_id(id);
    if (!existing_sport) {
      return { success: false, error: `Sport with ID '${id}' not found` };
    }

    if (input.code && input.code !== existing_sport.code) {
      const sport_with_code = await inMemorySportRepository.get_by_code(
        input.code,
      );
      if (sport_with_code && sport_with_code.id !== id) {
        return {
          success: false,
          error: `Sport with code '${input.code}' already exists`,
        };
      }
    }

    const updated_sport = await inMemorySportRepository.update(id, input);
    if (!updated_sport) {
      return { success: false, error: "Failed to update sport" };
    }

    return { success: true, data: updated_sport };
  } catch (error) {
    console.error("[SportService] Failed to update sport:", error);
    return { success: false, error: "Failed to update sport" };
  }
}

export async function delete_sport(
  id: string,
): Promise<SportServiceResult<boolean>> {
  if (!id || id.trim() === "") {
    return { success: false, error: "Sport ID is required" };
  }

  try {
    const deleted = await inMemorySportRepository.delete(id);
    if (!deleted) {
      return { success: false, error: `Sport with ID '${id}' not found` };
    }
    return { success: true, data: true };
  } catch (error) {
    console.error("[SportService] Failed to delete sport:", error);
    return { success: false, error: "Failed to delete sport" };
  }
}

export async function get_active_sports(): Promise<
  SportServiceResult<Sport[]>
> {
  try {
    const sports = await inMemorySportRepository.get_active();
    return { success: true, data: sports };
  } catch (error) {
    console.error("[SportService] Failed to get active sports:", error);
    return { success: false, error: "Failed to retrieve active sports" };
  }
}

export function get_effective_official_requirements(
  sport: Sport,
  competition_overrides?: OfficialRequirement[],
): OfficialRequirement[] {
  if (!competition_overrides || competition_overrides.length === 0) {
    return sport.official_requirements;
  }

  const merged_requirements: Map<string, OfficialRequirement> = new Map();

  for (const req of sport.official_requirements) {
    merged_requirements.set(req.role_id, req);
  }

  for (const override of competition_overrides) {
    merged_requirements.set(override.role_id, override);
  }

  return Array.from(merged_requirements.values());
}

export function get_official_requirement_source(
  role_id: string,
  sport: Sport,
  competition_overrides?: OfficialRequirement[],
): "sport" | "competition" {
  if (!competition_overrides) return "sport";

  const has_competition_override = competition_overrides.some(
    (req) => req.role_id === role_id,
  );
  return has_competition_override ? "competition" : "sport";
}

export const sportService = {
  get_all: get_all_sports,
  get_by_id: get_sport_by_id,
  get_by_code: get_sport_by_code,
  create: create_sport,
  update: update_sport,
  delete: delete_sport,
  get_active: get_active_sports,
  get_effective_official_requirements,
  get_official_requirement_source,
};
