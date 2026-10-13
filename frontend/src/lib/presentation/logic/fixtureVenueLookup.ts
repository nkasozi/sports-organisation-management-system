import type { Venue } from "$lib/core/entities/Venue";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { VenueUseCases } from "$lib/core/usecases/VenueUseCases";

const VENUE_SEARCH_PAGE = { page_number: 1, page_size: 10 };

function is_same_venue_name(first_name: string, second_name: string): boolean {
  return first_name.trim().toLowerCase() === second_name.trim().toLowerCase();
}

export async function find_fixture_venue(
  venue_name: string,
  venue_use_cases: Pick<VenueUseCases, "list">,
): Promise<Option<Venue>> {
  if (venue_name.trim().length === 0) return create_none_option();
  const venues_result = await venue_use_cases.list(
    { name_contains: venue_name },
    VENUE_SEARCH_PAGE,
  );
  if (!venues_result.success) return create_none_option();
  const matching_venue = venues_result.data.items.find((venue) =>
    is_same_venue_name(venue.name, venue_name),
  );
  return matching_venue
    ? create_some_option(matching_venue)
    : create_none_option();
}
