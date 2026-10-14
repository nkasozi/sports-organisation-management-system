import type { PublicTableName } from "./sync_table_catalog";

export const PublicProjectionKind = {
  ALL_FIELDS: "all_fields",
  FIELD_ALLOWLIST: "field_allowlist",
} as const;

type PublicProjection =
  | { kind: typeof PublicProjectionKind.ALL_FIELDS }
  | {
      kind: typeof PublicProjectionKind.FIELD_ALLOWLIST;
      public_fields: readonly string[];
      private_fields: readonly string[];
    };

const CONVEX_SYSTEM_FIELDS = ["_id", "_creationTime"] as const;
const SYNC_AND_TIMESTAMP_FIELDS = [
  "id",
  "local_id",
  "synced_at",
  "version",
  "sync_sequence",
  "created_at",
  "updated_at",
] as const;
const PERSON_CONTACT_FIELDS = [
  "email",
  "phone",
  "date_of_birth",
  "emergency_contact_name",
  "emergency_contact_phone",
] as const;

const ALL_FIELDS: PublicProjection = { kind: PublicProjectionKind.ALL_FIELDS };

const ORGANIZATION_PROJECTION: PublicProjection = {
  kind: PublicProjectionKind.FIELD_ALLOWLIST,
  public_fields: [
    ...SYNC_AND_TIMESTAMP_FIELDS,
    "name",
    "description",
    "sport_id",
    "logo_url",
    "website",
    "address",
    "founded_date",
    "status",
  ],
  private_fields: ["contact_email", "contact_phone"],
};

const PLAYER_PROJECTION: PublicProjection = {
  kind: PublicProjectionKind.FIELD_ALLOWLIST,
  public_fields: [
    ...SYNC_AND_TIMESTAMP_FIELDS,
    "first_name",
    "last_name",
    "gender_id",
    "organization_id",
    "position_id",
    "nationality",
    "height_cm",
    "weight_kg",
    "profile_image_url",
    "status",
  ],
  private_fields: [
    ...PERSON_CONTACT_FIELDS,
    "medical_notes",
    "created_by_user_id",
  ],
};

const OFFICIAL_PROJECTION: PublicProjection = {
  kind: PublicProjectionKind.FIELD_ALLOWLIST,
  public_fields: [
    ...SYNC_AND_TIMESTAMP_FIELDS,
    "first_name",
    "last_name",
    "gender_id",
    "organization_id",
    "years_of_experience",
    "nationality",
    "profile_image_url",
    "status",
  ],
  private_fields: [...PERSON_CONTACT_FIELDS, "notes"],
};

const TEAM_STAFF_PROJECTION: PublicProjection = {
  kind: PublicProjectionKind.FIELD_ALLOWLIST,
  public_fields: [
    ...SYNC_AND_TIMESTAMP_FIELDS,
    "organization_id",
    "team_id",
    "role_id",
    "first_name",
    "last_name",
    "photo_url",
    "profile_image_url",
    "nationality",
    "status",
  ],
  private_fields: [
    ...PERSON_CONTACT_FIELDS,
    "employment_start_date",
    "employment_end_date",
    "notes",
  ],
};

export const PUBLIC_RECORD_PROJECTIONS: Record<
  PublicTableName,
  PublicProjection
> = {
  organizations: ORGANIZATION_PROJECTION,
  sports: ALL_FIELDS,
  competitions: ALL_FIELDS,
  competition_formats: ALL_FIELDS,
  competition_stages: ALL_FIELDS,
  competition_teams: ALL_FIELDS,
  teams: ALL_FIELDS,
  fixtures: ALL_FIELDS,
  fixture_lineups: ALL_FIELDS,
  fixture_details_setups: ALL_FIELDS,
  officials: OFFICIAL_PROJECTION,
  team_staff: TEAM_STAFF_PROJECTION,
  team_staff_roles: ALL_FIELDS,
  game_official_roles: ALL_FIELDS,
  activities: ALL_FIELDS,
  activity_categories: ALL_FIELDS,
  players: PLAYER_PROJECTION,
  player_positions: ALL_FIELDS,
  player_team_memberships: ALL_FIELDS,
};

function pick_fields(
  record: Record<string, unknown>,
  field_names: readonly string[],
): Record<string, unknown> {
  const projected_record: Record<string, unknown> = {};
  for (const field_name of [...CONVEX_SYSTEM_FIELDS, ...field_names]) {
    if (field_name in record) projected_record[field_name] = record[field_name];
  }
  return projected_record;
}

export function project_public_records(
  table_name: PublicTableName,
  records: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const projection = PUBLIC_RECORD_PROJECTIONS[table_name];
  switch (projection.kind) {
    case PublicProjectionKind.ALL_FIELDS:
      return records;
    case PublicProjectionKind.FIELD_ALLOWLIST:
      return records.map((record) =>
        pick_fields(record, projection.public_fields),
      );
  }
}
