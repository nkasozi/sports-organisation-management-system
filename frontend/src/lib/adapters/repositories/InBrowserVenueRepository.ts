import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../../core/entities/Venue";
import type { VenueFilter, VenueRepository } from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
import { create_default_venues } from "./InBrowserVenueRepositoryDefaults";

const ENTITY_PREFIX = "venue";

const VENUE_FILTER_RULES: EntityFilterRule<Venue, VenueFilter>[] = [
  text_contains_rule("name_contains", (venue) => venue.name),
  equals_rule("city"),
  equals_rule("country"),
  equals_rule("status"),
];

export class InBrowserVenueRepository
  extends InBrowserBaseRepository<
    Venue,
    CreateVenueInput,
    UpdateVenueInput,
    VenueFilter
  >
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
    id: Venue["id"],
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
    } as Venue;
  }

  protected apply_updates_to_entity(
    entity: Venue,
    updates: UpdateVenueInput,
  ): Venue {
    return {
      ...entity,
      ...updates,
    } as Venue;
  }

  protected apply_entity_filter(
    entities: Venue[],
    filter: VenueFilter,
  ): Venue[] {
    return apply_entity_filter_rules(entities, filter, VENUE_FILTER_RULES);
  }

  async find_active_venues(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Venue> {
    return this.find_all({ status: "active" }, options);
  }
}

export const get_venue_repository: () => VenueRepository =
  create_lazy_repository_accessor(() => new InBrowserVenueRepository());

export function reset_venue_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    (get_venue_repository() as InBrowserVenueRepository).with_write_origin(
      origin,
    ),
    create_default_venues(),
  );
}
