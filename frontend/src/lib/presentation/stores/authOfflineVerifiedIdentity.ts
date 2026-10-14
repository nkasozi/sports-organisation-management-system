import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import { get_app_settings_storage } from "$lib/infrastructure/container";

export interface VerifiedIdentityRecord {
  clerk_user_id: string;
  email: string;
}

const VERIFIED_IDENTITY_KEY = "sports_org_verified_identity";
const STRING_TYPE_NAME = "string";
const VERIFIED_IDENTITY_PARSE_FAILED_EVENT = "verified_identity_parse_failed";

function is_non_empty_text(value: unknown): value is string {
  return typeof value === STRING_TYPE_NAME && (value as string).length > 0;
}

function read_identity_fields(
  parsed: Record<string, unknown>,
): Option<VerifiedIdentityRecord> {
  if (
    !is_non_empty_text(parsed.clerk_user_id) ||
    !is_non_empty_text(parsed.email)
  )
    return create_none_option();
  return create_some_option({
    clerk_user_id: parsed.clerk_user_id,
    email: parsed.email,
  });
}

export function parse_verified_identity_record(
  raw_value: string,
): Option<VerifiedIdentityRecord> {
  if (raw_value.length === 0) return create_none_option();
  try {
    return read_identity_fields(
      JSON.parse(raw_value) as Record<string, unknown>,
    );
  } catch (error) {
    console.warn("[AuthStore] Verified identity record unreadable", {
      event: VERIFIED_IDENTITY_PARSE_FAILED_EVENT,
      error: String(error),
    });
    return create_none_option();
  }
}

export async function load_verified_identity(): Promise<
  Option<VerifiedIdentityRecord>
> {
  return parse_verified_identity_record(
    await get_app_settings_storage().get_setting(VERIFIED_IDENTITY_KEY),
  );
}

export async function save_verified_identity(
  record: VerifiedIdentityRecord,
): Promise<boolean> {
  await get_app_settings_storage().set_setting(
    VERIFIED_IDENTITY_KEY,
    JSON.stringify(record),
  );
  return true;
}

const VERIFIED_IDENTITY_SAVE_FAILED_EVENT = "verified_identity_save_failed";

export async function remember_verified_identity(
  record: VerifiedIdentityRecord,
): Promise<boolean> {
  if (
    !is_non_empty_text(record.clerk_user_id) ||
    !is_non_empty_text(record.email)
  )
    return false;
  try {
    return await save_verified_identity(record);
  } catch (error) {
    console.error("[AuthStore] Verified identity could not be saved", {
      event: VERIFIED_IDENTITY_SAVE_FAILED_EVENT,
      error: String(error),
    });
    return false;
  }
}
