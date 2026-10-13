export const PROFILE_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type ProfileVisibility =
  (typeof PROFILE_VISIBILITY)[keyof typeof PROFILE_VISIBILITY];

export const PROFILE_VISIBILITY_SELECT_OPTIONS: {
  value: ProfileVisibility;
  label: string;
}[] = [
  {
    value: PROFILE_VISIBILITY.PUBLIC,
    label: "Public - Anyone with the link can view",
  },
  { value: PROFILE_VISIBILITY.PRIVATE, label: "Private - Only you can view" },
];

export const INVALID_PROFILE_VISIBILITY_MESSAGE =
  "Visibility must be public or private";

const VALID_PROFILE_VISIBILITIES: ReadonlySet<string> = new Set(
  Object.values(PROFILE_VISIBILITY),
);

const SLUG_INVALID_CHARACTERS = /[^a-z0-9]/g;
const SLUG_REPEATED_SEPARATORS = /-+/g;
const SLUG_EDGE_SEPARATORS = /^-|-$/g;
const SLUG_SEPARATOR = "-";
const SLUG_EMPTY = "";
const SLUG_ID_SUFFIX_LENGTH = 6;

export function is_invalid_profile_visibility(
  visibility: string | undefined,
): boolean {
  return (
    Boolean(visibility) &&
    !VALID_PROFILE_VISIBILITIES.has(visibility ?? SLUG_EMPTY)
  );
}

export function build_profile_slug(
  name_part: string,
  entity_id: string,
): string {
  const normalized_name = name_part
    .toLowerCase()
    .replace(SLUG_INVALID_CHARACTERS, SLUG_SEPARATOR)
    .replace(SLUG_REPEATED_SEPARATORS, SLUG_SEPARATOR)
    .replace(SLUG_EDGE_SEPARATORS, SLUG_EMPTY);
  const id_suffix = entity_id.slice(-SLUG_ID_SUFFIX_LENGTH);
  return `${normalized_name}${SLUG_SEPARATOR}${id_suffix}`;
}
