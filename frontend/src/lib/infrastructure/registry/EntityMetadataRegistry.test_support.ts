import { expect } from "vitest";

import type { EntityMetadata } from "../../core/entities/BaseEntity";
import { entityMetadataRegistry } from "./EntityMetadataRegistry";

export function get_present_metadata(entity_type: string): EntityMetadata {
  const metadata = entityMetadataRegistry.get_entity_metadata(entity_type);

  expect(metadata).not.toBe(false);

  return metadata as EntityMetadata;
}
