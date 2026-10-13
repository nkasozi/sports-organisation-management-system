import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "./option";
import {
  check_entity_permission,
  check_entity_permission_in_any_scope,
  DataAction,
  get_entity_data_category,
} from "./permission_checks";
import {
  ALLOWED_SYNC_TABLES,
  get_entity_type_for_table,
} from "./sync_table_catalog";

describe("get_entity_data_category", () => {
  it("maps every syncable table to an explicit data category", () => {
    for (const table_name of ALLOWED_SYNC_TABLES) {
      expect(
        get_entity_data_category(get_entity_type_for_table(table_name)).status,
        `${table_name} has no explicit data category`,
      ).toBe("some");
    }
  });

  it("normalizes separators before looking up the category", () => {
    expect(get_entity_data_category("official_associated_team")).toEqual(
      create_some_option("organisation_level"),
    );
  });

  it("returns none for unknown entity types instead of a default", () => {
    expect(get_entity_data_category("unknown_entity")).toEqual(
      create_none_option(),
    );
  });

  it("keeps sensitive person data out of the public category", () => {
    for (const entity_type of [
      "identification",
      "qualification",
      "playerprofile",
      "teamprofile",
    ]) {
      expect(get_entity_data_category(entity_type)).not.toEqual(
        create_some_option("public_level"),
      );
    }
  });
});

describe("check_entity_permission", () => {
  it("denies every action on unknown entity types, even for super admins", () => {
    expect(
      check_entity_permission("super_admin", "unknown_entity", DataAction.READ),
    ).toBe(false);
  });

  it("does not let players create or delete identifications", () => {
    expect(
      check_entity_permission("player", "identification", DataAction.CREATE),
    ).toBe(false);
    expect(
      check_entity_permission("player", "identification", DataAction.DELETE),
    ).toBe(false);
  });

  it("lets org admins manage activities and official team associations", () => {
    for (const entity_type of ["activity", "officialassociatedteam"]) {
      expect(
        check_entity_permission("org_admin", entity_type, DataAction.CREATE),
      ).toBe(true);
    }
  });
});

describe("check_entity_permission_in_any_scope", () => {
  it("lets players create and delete identifications within their own records", () => {
    for (const action of [DataAction.CREATE, DataAction.DELETE])
      expect(
        check_entity_permission_in_any_scope(
          "player",
          "identification",
          action,
        ),
      ).toBe(true);
  });

  it("does not widen roles without an own-record grant", () => {
    expect(
      check_entity_permission_in_any_scope(
        "official",
        "identification",
        DataAction.CREATE,
      ),
    ).toBe(false);
    expect(
      check_entity_permission_in_any_scope(
        "player",
        "qualification",
        DataAction.DELETE,
      ),
    ).toBe(false);
  });
});
