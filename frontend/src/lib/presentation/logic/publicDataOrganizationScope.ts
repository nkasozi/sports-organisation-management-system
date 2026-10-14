import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

export function build_public_organization_scope(
  organization_id: string,
): Option<string> {
  const trimmed_organization_id = organization_id.trim();
  return trimmed_organization_id.length > 0
    ? create_some_option(trimmed_organization_id)
    : create_none_option();
}
