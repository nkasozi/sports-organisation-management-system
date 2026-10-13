import { vi } from "vitest";

import type { CreatePlayerInput, Player } from "../entities/Player";
import type { PlayerRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";

export function create_mock_player(
  overrides: Partial<ScalarInput<Player>> = {},
): Player {
  return {
    id: "player_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    first_name: "John",
    last_name: "Doe",
    gender_id: "gender_default_male",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 180,
    weight_kg: 75,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+0987654321",
    medical_notes: "",
    status: "active",
    ...overrides,
  } as unknown as Player;
}

export function create_valid_player_input(
  overrides: Partial<CreatePlayerInput> = {},
): CreatePlayerInput {
  return {
    first_name: "John",
    last_name: "Doe",
    gender_id: "gender_default_male",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 180,
    weight_kg: 75,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+0987654321",
    medical_notes: "",
    status: "active",
    ...overrides,
  } as CreatePlayerInput;
}

export function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return {
    success: true,
    data: {
      items,
      total_count: total_count ?? items.length,
      page_number: 1,
      page_size: 10,
      total_pages: Math.ceil((total_count ?? items.length) / 10),
    },
  } as Result<PaginatedResult<T>, string>;
}

export function create_mock_repository(): PlayerRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_team: vi.fn(),
    find_active_players: vi.fn(),
    find_by_jersey_number: vi.fn(),
  } as PlayerRepository;
}
