import type { Table } from "dexie";
import type {
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
} from "../../core/entities/Venue";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  VenueRepository,
  VenueFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "venue";

export class InBrowserVenueRepository
  extends InBrowserBaseRepository<Venue, CreateVenueInput, UpdateVenueInput, VenueFilter>
  implements VenueRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Venue, string> {
    return this.database.venues;
  }

  protected create_entity_from_input(
    input: CreateVenueInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Venue {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
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

  protected apply_entity_filter(entities: Venue[], filter: VenueFilter): Venue[] {
    let filtered_entities = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((venue) =>
        venue.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.city) {
      filtered_entities = filtered_entities.filter(
        (venue) => venue.city === filter.city,
      );
    }

    if (filter.country) {
      filtered_entities = filtered_entities.filter(
        (venue) => venue.country === filter.country,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (venue) => venue.status === filter.status,
      );
    }

    return filtered_entities;
  }

  async find_active_venues(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Venue> {
    return this.find_all({ status: "active" }, options);
  }
}

export function create_default_venues(): Venue[] {
  const now = new Date().toISOString();

  return [
    {
      id: "venue_default_1",
      organization_id: "org_default_1",
      name: "Lugogo Hockey Stadium",
      short_name: "Lugogo",
      address: "Plot 2-12 Lugogo Bypass",
      city: "Kampala",
      country: "Uganda",
      capacity: 5000,
      surface_type: "astroturf",
      has_lighting: true,
      has_parking: true,
      contact_email: "info@lugogostadium.ug",
      contact_phone: "+256-700-111-222",
      website: "https://lugogostadium.ug",
      image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "venue_default_2",
      organization_id: "org_default_1",
      name: "Makerere University Hockey Pitch",
      short_name: "Makerere",
      address: "University Road, Makerere Hill",
      city: "Kampala",
      country: "Uganda",
      capacity: 2000,
      surface_type: "grass",
      has_lighting: false,
      has_parking: true,
      contact_email: "sports@mak.ac.ug",
      contact_phone: "+256-700-333-444",
      website: "https://mak.ac.ug/sports",
      image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "venue_default_3",
      organization_id: "org_default_1",
      name: "Kyadondo Rugby Club",
      short_name: "Kyadondo",
      address: "Kira Road, Kamwokya",
      city: "Kampala",
      country: "Uganda",
      capacity: 3000,
      surface_type: "grass",
      has_lighting: true,
      has_parking: true,
      contact_email: "info@kyadondoclub.ug",
      contact_phone: "+256-700-555-666",
      website: "https://kyadondoclub.ug",
      image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserVenueRepository | null = null;

export function get_venue_repository(): VenueRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserVenueRepository();
  }
  return singleton_instance;
}

export async function initialize_venue_repository(): Promise<void> {
  const repository = get_venue_repository() as InBrowserVenueRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_venues());
  }
}

export async function reset_venue_repository(): Promise<void> {
  const repository = get_venue_repository() as InBrowserVenueRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_venues());
}
