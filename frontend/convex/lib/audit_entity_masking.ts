import { SYSTEM_USER_ENTITY_TYPE } from "./system_user_constants";

const MASKED_SYSTEM_USER_PREFIX = `${SYSTEM_USER_ENTITY_TYPE}_ref_`;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const HEX_RADIX = 16;
const HASH_HEX_LENGTH = 8;
const HEX_PADDING_CHARACTER = "0";

function compute_fnv1a_hash(value: string): string {
  let hash = FNV_OFFSET_BASIS;
  for (
    let character_index = 0;
    character_index < value.length;
    character_index++
  ) {
    hash ^= value.charCodeAt(character_index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash
    .toString(HEX_RADIX)
    .padStart(HASH_HEX_LENGTH, HEX_PADDING_CHARACTER);
}

function requires_masking(entity_type: string, entity_id: string): boolean {
  return (
    entity_type === SYSTEM_USER_ENTITY_TYPE &&
    entity_id.length > 0 &&
    !entity_id.startsWith(MASKED_SYSTEM_USER_PREFIX)
  );
}

export function to_auditable_entity_id(
  entity_type: string,
  entity_id: string,
): string {
  return requires_masking(entity_type, entity_id)
    ? `${MASKED_SYSTEM_USER_PREFIX}${compute_fnv1a_hash(entity_id)}`
    : entity_id;
}
