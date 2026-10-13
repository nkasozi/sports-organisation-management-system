import type { EntityMetadata } from "$lib/core/entities/BaseEntity";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";

export function find_dynamic_entity_form_metadata(
  entity_type: string,
): Option<EntityMetadata> {
  const normalized_type = entity_type.toLowerCase();
  const metadata = entityMetadataRegistry.get_entity_metadata(normalized_type);
  if (metadata) return create_some_option(metadata);
  console.error("[DynamicEntityForm] No metadata found for entity type", {
    event: "dynamic_entity_form_metadata_missing",
    entity_type,
    normalized_type,
  });
  return create_none_option();
}

export function build_dynamic_entity_form_metadata_props(
  metadata_option: Option<EntityMetadata>,
): Partial<{ entity_metadata: EntityMetadata }> {
  switch (metadata_option.status) {
    case OptionStatus.SOME:
      return { entity_metadata: metadata_option.value };
    case OptionStatus.NONE:
      return {};
  }
}
