import { describe, it, expect } from "vitest";
import {
  SHARED_ROLE_PERMISSIONS,
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ENTITY_CATEGORIES,
  ALL_ROLES,
  ALL_CATEGORIES,
  type SharedEntityType,
} from "$convex/shared_permission_definitions";
import {
  get_role_permissions,
  get_entity_data_category,
} from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import type { UserRole } from "$lib/core/interfaces/ports";

describe("permission single source of truth", () => {
  describe("get_entity_data_category reads SHARED_ENTITY_CATEGORY_MAP directly", () => {
    it("returns the canonical category for every entity type", () => {
      for (const { entity_type, data_category } of SHARED_ENTITY_CATEGORIES) {
        expect(
          get_entity_data_category(entity_type),
          `${entity_type} should map to ${data_category}`,
        ).toBe(data_category);
      }
    });

    it("covers every key in SHARED_ENTITY_CATEGORY_MAP", () => {
      for (const entity_type of Object.keys(
        SHARED_ENTITY_CATEGORY_MAP,
      ) as SharedEntityType[]) {
        expect(get_entity_data_category(entity_type)).toBe(
          SHARED_ENTITY_CATEGORY_MAP[entity_type],
        );
      }
    });
  });

  describe("get_role_permissions derives from SHARED_ROLE_PERMISSIONS", () => {
    for (const role of ALL_ROLES) {
      for (const category of ALL_CATEGORIES) {
        it(`${role}/${category}: can_create/read/update/delete maps to create/read/update/delete`, () => {
          const local_perms = get_role_permissions(role as UserRole)[category];
          const shared_perms =
            SHARED_ROLE_PERMISSIONS[
              role as keyof typeof SHARED_ROLE_PERMISSIONS
            ][
              category as keyof (typeof SHARED_ROLE_PERMISSIONS)[keyof typeof SHARED_ROLE_PERMISSIONS]
            ];

          expect(local_perms.create).toBe(shared_perms.can_create);
          expect(local_perms.read).toBe(shared_perms.can_read);
          expect(local_perms.update).toBe(shared_perms.can_update);
          expect(local_perms.delete).toBe(shared_perms.can_delete);
        });
      }
    }
  });
});
