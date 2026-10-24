import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_display_name_from_metadata,
  get_display_value_for_entity_field,
} from "./dynamicListLogic";
import {
  create_test_entity,
  create_test_entity_metadata,
  create_test_field_metadata,
} from "./dynamicListLogic.test_support";

describe("get_display_value_for_entity_field", () => {
  it("should return empty string for missing entity", () => {
    const result = get_display_value_for_entity_field(
      {} as unknown as BaseEntity,
      "name",
      {},
    );
    expect(result).toBe("");
  });

  it("should return empty string for empty field name", () => {
    const entity = create_test_entity("1", "Test");
    const result = get_display_value_for_entity_field(entity, "", {});
    expect(result).toBe("");
  });

  it("should return empty string for missing field value", () => {
    const entity = {
      id: "1",
    } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(
      entity,
      "nullable_field",
      {},
    );
    expect(result).toBe("");
  });

  it("should return empty string for undefined field value", () => {
    const entity = create_test_entity("1", "Test");
    const result = get_display_value_for_entity_field(
      entity,
      "nonexistent_field",
      {},
    );
    expect(result).toBe("");
  });

  it("should return string value directly", () => {
    const entity = create_test_entity("1", "Test Name");
    const result = get_display_value_for_entity_field(entity, "name", {});
    expect(result).toBe("Test Name");
  });

  it("should convert number to string", () => {
    const entity = { id: "1", count: 42 } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "count", {});
    expect(result).toBe("42");
  });

  it("should convert boolean true to 'Yes'", () => {
    const entity = { id: "1", is_active: true } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "is_active", {});
    expect(result).toBe("Yes");
  });

  it("should convert boolean false to 'No'", () => {
    const entity = { id: "1", is_active: false } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "is_active", {});
    expect(result).toBe("No");
  });

  it("should resolve foreign key to display name", () => {
    const entity = { id: "1", team_id: "team-123" } as unknown as BaseEntity;
    const foreign_key_options = {
      team_id: [
        { id: "team-123", name: "Manchester United" } as unknown as BaseEntity,
        { id: "team-456", name: "Liverpool" } as unknown as BaseEntity,
      ],
    };
    const result = get_display_value_for_entity_field(
      entity,
      "team_id",
      foreign_key_options,
    );
    expect(result).toBe("Manchester United");
  });

  it("should return the raw value when foreign key option not found", () => {
    const entity = {
      id: "1",
      team_id: "unknown-team",
    } as unknown as BaseEntity;
    const foreign_key_options = {
      team_id: [
        { id: "team-123", name: "Manchester United" } as unknown as BaseEntity,
      ],
    };
    const result = get_display_value_for_entity_field(
      entity,
      "team_id",
      foreign_key_options,
    );
    expect(result).toBe("unknown-team");
  });

  it("should return raw value without enum formatting for unresolved FK with metadata", () => {
    const entity = {
      id: "1",
      sport_id: "sport-field-hockey-default",
    } as unknown as BaseEntity;
    const foreign_key_options = {
      sport_id: [] as BaseEntity[],
    };
    const field_metadata = create_test_field_metadata(
      "sport_id",
      "foreign_key",
      {
        foreign_key_entity: "sport",
      },
    );
    const result = get_display_value_for_entity_field(
      entity,
      "sport_id",
      foreign_key_options,
      field_metadata,
    );
    expect(result).toBe("sport-field-hockey-default");
  });
});

describe("build_display_name_from_metadata", () => {
  it("should use metadata display_name when valid", () => {
    const metadata = create_test_entity_metadata([], "Team");
    const result = build_display_name_from_metadata(
      { status: "present", entity_metadata: metadata },
      "teams",
    );
    expect(result).toBe("Team");
  });

  it("should fall back to entity_type when metadata is missing", () => {
    const result = build_display_name_from_metadata(
      { status: "missing" },
      "players",
    );
    expect(result).toBe("players");
  });

  it("should fall back to entity_type when display_name is empty", () => {
    const metadata = create_test_entity_metadata([], "");
    const result = build_display_name_from_metadata(
      { status: "present", entity_metadata: metadata },
      "competitions",
    );
    expect(result).toBe("competitions");
  });

  it("should return 'Entity' when both are empty", () => {
    const result = build_display_name_from_metadata({ status: "missing" }, "");
    expect(result).toBe("Entity");
  });
});
