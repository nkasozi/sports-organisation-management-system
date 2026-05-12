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
  parse_email_address,
  parse_non_negative_integer_value,
  parse_optional_http_url_value,
  parse_optional_media_url_value,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

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

function create_empty_venue_input(): CreateVenueInput {
  return {
    organization_id: "",
    name: "",
    short_name: "",
    address: "",
    city: "",
    country: "",
    capacity: 0,
    surface_type: "grass",
    has_lighting: false,
    has_parking: false,
    contact_email: "",
    contact_phone: "",
    website: "",
    image_url: "",
    status: "active",
  };
}

export function validate_venue_input(input: CreateVenueInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Venue name must be at least 2 characters");
  }

  const capacity_result = parse_non_negative_integer_value(
    input.capacity,
    "Capacity cannot be negative",
  );
  if (!capacity_result.success) {
    validation_errors.push(capacity_result.error);
  }

  if (input.contact_email.length > 0) {
    const contact_email_result = parse_email_address(
      input.contact_email,
      "Invalid email format",
    );
    if (!contact_email_result.success) {
      validation_errors.push(contact_email_result.error);
    }
  }

  const website_result = parse_optional_http_url_value(
    input.website,
    "Website URL is invalid",
  );
  if (!website_result.success) {
    validation_errors.push(website_result.error);
  }

  const image_url_result = parse_optional_media_url_value(
    input.image_url,
    "Image URL is invalid",
  );
  if (!image_url_result.success) {
    validation_errors.push(image_url_result.error);
  }

  return validation_errors;
}

function get_venue_image(venue: Venue): string {
  return venue.image_url && venue.image_url.trim() !== ""
    ? venue.image_url
    : DEFAULT_VENUE_IMAGE;
}
