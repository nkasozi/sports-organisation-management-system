import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface Venue extends BaseEntity {
  name: string;
  short_name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  surface_type: string;
  has_lighting: boolean;
  has_parking: boolean;
  contact_email: string;
  contact_phone: string;
  website: string;
  image_url: string;
  status: EntityStatus;
}

export type CreateVenueInput = Omit<Venue, "id" | "created_at" | "updated_at">;
export type UpdateVenueInput = Partial<CreateVenueInput>;

export const DEFAULT_VENUE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234B5563'/%3E%3Cpath d='M20 70h60v10H20zM15 60h70L50 30z' fill='%239CA3AF'/%3E%3Crect x='40' y='50' width='20' height='20' fill='%236B7280'/%3E%3C/svg%3E";

export function create_empty_venue_input(): CreateVenueInput {
  return {
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

  if (input.capacity < 0) {
    validation_errors.push("Capacity cannot be negative");
  }

  if (input.contact_email && !is_valid_email(input.contact_email)) {
    validation_errors.push("Invalid email format");
  }

  return validation_errors;
}

function is_valid_email(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}

export function get_venue_image(venue: Venue): string {
  return venue.image_url && venue.image_url.trim() !== ""
    ? venue.image_url
    : DEFAULT_VENUE_IMAGE;
}
