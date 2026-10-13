import { vi } from "vitest";

import type {
  EmptyRepositoryMock,
  ListingRepositoryMock,
  UpdatableListingRepositoryMock,
} from "./seedingServiceMockTypes.test_support";

type SeedRecord = Record<string, unknown>;

function with_origin_binding<
  TRepository extends { with_write_origin(): unknown },
>(fields: Omit<TRepository, "with_write_origin">): TRepository {
  const repository = {
    ...fields,
    with_write_origin: (): TRepository => repository,
  } as TRepository;
  return repository;
}

export function create_empty_repo(): EmptyRepositoryMock {
  return with_origin_binding<EmptyRepositoryMock>({
    seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
    find_all: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [], total_count: 0 },
    }),
    find_all_with_filter: vi.fn().mockResolvedValue({
      success: true,
      data: { items: [], total_count: 0 },
    }),
    update: vi.fn().mockResolvedValue({ success: true, data: {} }),
  });
}

export function create_listing_repository(
  items: SeedRecord[],
): ListingRepositoryMock {
  return with_origin_binding<ListingRepositoryMock>({
    seed_with_data: vi.fn().mockResolvedValue({ success: true, data: 0 }),
    find_all: vi.fn().mockImplementation(async () => ({
      success: true,
      data: {
        items: [...items],
        total_count: items.length,
      },
    })),
  });
}

export function create_updatable_listing_repository(
  items: SeedRecord[],
): UpdatableListingRepositoryMock {
  return with_origin_binding<UpdatableListingRepositoryMock>({
    ...create_listing_repository(items),
    update: vi.fn().mockImplementation(async (id: string, updates: object) => ({
      success: true,
      data: {
        ...(items.find((item) => item.id === id) ?? {}),
        ...updates,
        id,
      },
    })),
  });
}
