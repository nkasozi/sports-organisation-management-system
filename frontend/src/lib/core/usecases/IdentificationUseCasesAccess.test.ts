import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IdentificationRepository } from "../interfaces/ports";
import { build_record_owners_for_player } from "../interfaces/ports";
import type { EntityId } from "../types/DomainScalars";
import { create_identification_use_cases } from "./IdentificationUseCases";
import {
  create_mock_repository,
  create_test_identification,
  create_valid_input,
} from "./IdentificationUseCases.test_support";
import {
  type IdentificationActor,
  IdentificationActorStatus,
} from "./IdentificationUseCasesAccess";

const OWN_PLAYER_ID = "player-own" as EntityId;
const OTHER_PLAYER_ID = "player-other" as EntityId;

function build_actor(role: string, player_id: string): IdentificationActor {
  return {
    status: IdentificationActorStatus.AVAILABLE,
    role,
    owners: build_record_owners_for_player(player_id),
  };
}

function build_use_cases(
  repository: IdentificationRepository,
  actor: IdentificationActor,
): ReturnType<typeof create_identification_use_cases> {
  return create_identification_use_cases(repository, () => actor);
}

describe("IdentificationUseCases player ownership", () => {
  let repository: IdentificationRepository;
  const player_actor = build_actor("player", OWN_PLAYER_ID);

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => true);
    repository = create_mock_repository();
    vi.mocked(repository.create).mockResolvedValue({
      success: true,
      data: create_test_identification({ holder_id: OWN_PLAYER_ID }),
    });
    vi.mocked(repository.update).mockResolvedValue({
      success: true,
      data: create_test_identification({ holder_id: OWN_PLAYER_ID }),
    });
    vi.mocked(repository.delete_by_id).mockResolvedValue({
      success: true,
      data: true,
    });
  });

  function mock_existing(holder_id: EntityId): void {
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_identification({ holder_id }),
    });
  }

  it("lets a player create an identification for their own player", async () => {
    const result = await build_use_cases(repository, player_actor).create(
      create_valid_input({ holder_id: OWN_PLAYER_ID }),
    );
    expect(result.success).toBe(true);
  });

  it("blocks a player creating an identification for another player", async () => {
    const result = await build_use_cases(repository, player_actor).create(
      create_valid_input({ holder_id: OTHER_PLAYER_ID }),
    );
    expect(result.success).toBe(false);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("blocks a player without a linked player from creating identifications", async () => {
    const result = await build_use_cases(
      repository,
      build_actor("player", ""),
    ).create(create_valid_input({ holder_id: OWN_PLAYER_ID }));
    expect(result.success).toBe(false);
  });

  it("blocks a player creating a verified identification", async () => {
    const result = await build_use_cases(repository, player_actor).create({
      ...create_valid_input({ holder_id: OWN_PLAYER_ID }),
      is_verified: true,
    } as Parameters<IdentificationRepository["create"]>[0]);
    expect(result.success).toBe(false);
  });

  it("lets a player update their own identification", async () => {
    mock_existing(OWN_PLAYER_ID);
    const result = await build_use_cases(repository, player_actor).update(
      "id-123",
      { notes: "renewed" },
    );
    expect(result.success).toBe(true);
  });

  it("blocks a player updating another player's identification", async () => {
    mock_existing(OTHER_PLAYER_ID);
    const result = await build_use_cases(repository, player_actor).update(
      "id-123",
      { notes: "hijacked" },
    );
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("blocks a player moving their identification to another player", async () => {
    mock_existing(OWN_PLAYER_ID);
    const result = await build_use_cases(repository, player_actor).update(
      "id-123",
      { holder_id: OTHER_PLAYER_ID },
    );
    expect(result.success).toBe(false);
  });

  it("lets a player delete only their own identification", async () => {
    mock_existing(OWN_PLAYER_ID);
    const own = await build_use_cases(repository, player_actor).delete(
      "id-123",
    );
    expect(own.success).toBe(true);
    mock_existing(OTHER_PLAYER_ID);
    vi.mocked(repository.delete_by_id).mockClear();
    const other = await build_use_cases(repository, player_actor).delete(
      "id-123",
    );
    expect(other.success).toBe(false);
    expect(repository.delete_by_id).not.toHaveBeenCalled();
  });

  it("blocks roles without identification write rights", async () => {
    const result = await build_use_cases(
      repository,
      build_actor("official", OWN_PLAYER_ID),
    ).create(create_valid_input({ holder_id: OWN_PLAYER_ID }));
    expect(result.success).toBe(false);
  });

  it("keeps administrators able to manage any identification", async () => {
    const admin = build_use_cases(repository, build_actor("org_admin", ""));
    expect(
      (await admin.create(create_valid_input({ holder_id: OTHER_PLAYER_ID })))
        .success,
    ).toBe(true);
    expect((await admin.delete("id-123")).success).toBe(true);
    expect(repository.find_by_id).not.toHaveBeenCalled();
  });
});
