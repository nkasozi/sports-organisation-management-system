import { describe, expect, it } from "vitest";

import {
  get_tables_for_page,
  PublicDataPageKind,
} from "./convexPublicDataTables";

describe("public page data includes sports for organizations", () => {
  it.each(Object.values(PublicDataPageKind))(
    "%s pages fetch sports alongside organizations",
    (page_kind) => {
      const tables = get_tables_for_page(page_kind);

      expect(tables).toContain("organizations");
      expect(tables).toContain("sports");
    },
  );
});
