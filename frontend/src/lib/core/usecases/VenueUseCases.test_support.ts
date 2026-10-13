import { vi } from "vitest";

import type { CreateVenueInput, Venue } from "../entities/Venue";
import type { VenueRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): VenueRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_active_venues: vi.fn(),
  } as VenueRepository;
}

export function create_test_venue(
  overrides: Partial<ScalarInput<Venue>> = {},
): Venue {
  return {
    id: "venue-123",
    organization_id: "org-123",
    name: "National Stadium",
    short_name: "Nat Stadium",
    address: "123 Main Street",
    city: "Kampala",
    country: "Uganda",
    capacity: 50000,
    surface_type: "grass",
    has_lighting: true,
    has_parking: true,
    contact_email: "venue@example.com",
    contact_phone: "256123456789",
    website: "https://venue.example.com",
    image_url: "https://example.com/image.jpg",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Venue;
}

export function create_valid_input(
  overrides: Partial<CreateVenueInput> = {},
): CreateVenueInput {
  return {
    organization_id: "org-123",
    name: "New Stadium",
    short_name: "New Stad",
    address: "456 Sports Ave",
    city: "Kampala",
    country: "Uganda",
    capacity: 30000,
    surface_type: "grass",
    has_lighting: true,
    has_parking: true,
    contact_email: "newvenue@example.com",
    contact_phone: "256987654321",
    website: "https://newvenue.example.com",
    image_url: "https://example.com/new.jpg",
    status: "active",
    ...overrides,
  } as CreateVenueInput;
}
