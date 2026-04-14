import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../../../../entities/Venue";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface VenueFilter {
  organization_id?: ScalarValueInput<Venue["organization_id"]>;
  name_contains?: string;
  city?: string;
  country?: string;
  status?: Venue["status"];
}

export interface VenueRepository extends FilterableRepository<
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  VenueFilter
> {
  find_active_venues(options?: QueryOptions): PaginatedAsyncResult<Venue>;
}
