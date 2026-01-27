import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../../core/entities/Venue";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  VenueRepository,
  VenueFilter,
} from "../../core/interfaces/adapters/VenueRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_venues";
const ENTITY_PREFIX = "venue";

export class InMemoryVenueRepository
  extends InMemoryBaseRepository<Venue, CreateVenueInput, UpdateVenueInput>
  implements VenueRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateVenueInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Venue {
    return {
      id,
      ...timestamps,
      name: input.name,
      short_name: input.short_name,
      address: input.address,
      city: input.city,
      country: input.country,
      capacity: input.capacity,
      surface_type: input.surface_type,
      has_lighting: input.has_lighting,
      has_parking: input.has_parking,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      website: input.website,
      image_url: input.image_url,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Venue,
    updates: UpdateVenueInput,
  ): Venue {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: VenueFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Venue> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_venues = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_venues = filtered_venues.filter((venue) =>
        venue.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.city) {
      filtered_venues = filtered_venues.filter(
        (venue) => venue.city === filter.city,
      );
    }

    if (filter.country) {
      filtered_venues = filtered_venues.filter(
        (venue) => venue.country === filter.country,
      );
    }

    if (filter.status) {
      filtered_venues = filtered_venues.filter(
        (venue) => venue.status === filter.status,
      );
    }

    const total_count = filtered_venues.length;
    const paginated_venues = this.apply_pagination_and_sort(
      filtered_venues,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_venues, total_count, options),
    );
  }

  async find_active_venues(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Venue> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

let venue_repository_instance: InMemoryVenueRepository | null = null;

export function get_venue_repository(): InMemoryVenueRepository {
  if (!venue_repository_instance) {
    venue_repository_instance = new InMemoryVenueRepository();
  }
  return venue_repository_instance;
}

export function reset_venue_repository(): void {
  venue_repository_instance = null;
}
