import { describe, expect, it, vi } from "vitest";

import type { PlayerRepository } from "../interfaces/ports";
import { create_player_use_cases } from "../usecases/PlayerUseCases";
import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreatePlayerInput } from "./Player";
import { PLAYER_INPUT_DEFAULTS } from "./PlayerInputDefaults";

describe("apply_entity_input_defaults", () => {
  it("fills only the fields that are missing", () => {
    expect(
      apply_entity_input_defaults(
        { size: 25, colour: "#FFFFFF" } as Record<string, unknown>,
        { name: "A", size: 18, colour: undefined } as Record<string, unknown>,
      ),
    ).toEqual({ name: "A", size: 18, colour: "#FFFFFF" });
  });

  it("keeps a zero the caller chose on purpose", () => {
    expect(apply_entity_input_defaults({ size: 25 }, { size: 0 })).toEqual({
      size: 0,
    });
  });

  it("keeps a blank value when the field has no default", () => {
    expect(
      apply_entity_input_defaults(
        { size: 25 } as Record<string, unknown>,
        { gender_id: "" } as Record<string, unknown>,
      ),
    ).toEqual({ size: 25, gender_id: "" });
  });

  it("treats a blank form value as not provided", () => {
    expect(
      apply_entity_input_defaults(
        { size: 25 },
        { size: "" as unknown as number },
      ),
    ).toEqual({ size: 25 });
  });
});

describe("creating a player without optional measurements", () => {
  it("saves the player with default measurements", async () => {
    const repository = {
      create: vi.fn(async (input: CreatePlayerInput) => ({
        success: true,
        data: { ...input, id: "player_new" },
      })),
    } as unknown as PlayerRepository;
    const submitted_player = {
      first_name: "Arnold",
      last_name: "Falcon",
      gender_id: "gender_male",
      date_of_birth: "1998-05-01",
      nationality: "Uganda",
      position_id: "position_forward",
      organization_id: "org_default_1",
      status: "active",
    } as unknown as CreatePlayerInput;

    const result =
      await create_player_use_cases(repository).create(submitted_player);

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        height_cm: PLAYER_INPUT_DEFAULTS.height_cm,
        weight_kg: PLAYER_INPUT_DEFAULTS.weight_kg,
      }),
    );
  });
});
