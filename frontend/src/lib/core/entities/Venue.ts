import type {
  EmailAddress,
  EntityId,
  Name,
  NonNegativeIntegerValue,
  OptionalHttpUrlValue,
  OptionalMediaUrlValue,
  ScalarInput,
} from "../types/DomainScalars";
import {
  parse_non_negative_integer_value,
  parse_optional_http_url_value,
  parse_optional_media_url_value,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_minimum_text_length,
  check_optional_email_address,
  collect_validation_errors,
} from "./EntityValidation";

const MINIMUM_NAME_LENGTH = 2;

const VENUE_VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: "Venue name must be at least 2 characters",
  NEGATIVE_CAPACITY: "Capacity cannot be negative",
  INVALID_EMAIL: "Invalid email format",
  INVALID_WEBSITE: "Website URL is invalid",
  INVALID_IMAGE_URL: "Image URL is invalid",
} as const;

export interface Venue extends BaseEntity {
  organization_id: EntityId;
  name: Name;
  short_name: Name;
  address: string;
  city: string;
  country: string;
  capacity: NonNegativeIntegerValue;
  surface_type: string;
  has_lighting: boolean;
  has_parking: boolean;
  contact_email: EmailAddress;
  contact_phone: string;
  website: OptionalHttpUrlValue;
  image_url: OptionalMediaUrlValue;
  status: EntityStatus;
}

export type CreateVenueInput = Omit<
  ScalarInput<Venue>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateVenueInput = Partial<CreateVenueInput>;

export const DEFAULT_VENUE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Cpath d='M20 70h60v10H20zM15 60h70L50 30z' fill='%239CA3AF'/%3E%3Crect x='40' y='50' width='20' height='20' fill='%236B7280'/%3E%3C/svg%3E";

export function validate_venue_input(input: CreateVenueInput): string[] {
  return collect_validation_errors([
    check_minimum_text_length(
      input.name,
      MINIMUM_NAME_LENGTH,
      VENUE_VALIDATION_MESSAGES.NAME_TOO_SHORT,
    ),
    parse_non_negative_integer_value(
      input.capacity,
      VENUE_VALIDATION_MESSAGES.NEGATIVE_CAPACITY,
    ),
    check_optional_email_address(
      input.contact_email,
      VENUE_VALIDATION_MESSAGES.INVALID_EMAIL,
    ),
    parse_optional_http_url_value(
      input.website,
      VENUE_VALIDATION_MESSAGES.INVALID_WEBSITE,
    ),
    parse_optional_media_url_value(
      input.image_url,
      VENUE_VALIDATION_MESSAGES.INVALID_IMAGE_URL,
    ),
  ]);
}
