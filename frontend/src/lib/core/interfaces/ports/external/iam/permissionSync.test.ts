import { describe, it, expect } from "vitest";
import {
  SHARED_ROLE_PERMISSIONS,
  SHARED_ENTITY_CATEGORIES,
  ALL_ROLES,
  ALL_CATEGORIES,
  type SharedEntityType,
} from "$convex/shared_permission_definitions";
import {
  DATA_PERMISSION_MAP,
  ENTITY_DATA_CATEGORY_MAP,
} from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import type { UserRole } from "$lib/core/interfaces/ports";

function convert_backend_to_frontend_format(
  role: string,
  category: string,
): { create: boolean; read: boolean; update: boolean; delete: boolean } {
  const backend_perms =
    SHARED_ROLE_PERMISSIONS[role as keyof typeof SHARED_ROLE_PERMISSIONS][
      category as keyof (typeof SHARED_ROLE_PERMISSIONS)[keyof typeof SHARED_ROLE_PERMISSIONS]
    ];
  return {
    create: backend_perms.can_create,
    read: backend_perms.can_read,
    update: backend_perms.can_update,
    delete: backend_perms.can_delete,
  };
}

describe("frontend-backend permission sync", () => {
  describe("role permission matrix", () => {
    for (const role of ALL_ROLES) {
      for (const category of ALL_CATEGORIES) {
        it(`${role} has matching ${category} permissions on both sides`, () => {
          const frontend_perms =
            DATA_PERMISSION_MAP[role as UserRole][category];
          const backend_perms = convert_backend_to_frontend_format(
            role,
            category,
          );

          expect(frontend_perms).toEqual(backend_perms);
        });
      }
    }
  });

  describe("entity-to-category mapping", () => {
    it("every backend entity maps to the same category on the frontend", () => {
      const mismatches: string[] = [];

      for (const entry of SHARED_ENTITY_CATEGORIES) {
        const frontend_category = ENTITY_DATA_CATEGORY_MAP[entry.entity_type];

        if (frontend_category !== entry.data_category) {
          mismatches.push(
            `${entry.entity_type}: backend="${entry.data_category}" frontend="${frontend_category || "MISSING"}"`,
          );
        }
      }

      expect(mismatches).toEqual([]);
    });

    it("every frontend entity maps to the same category on the backend", () => {
      const backend_map = new Map(
        SHARED_ENTITY_CATEGORIES.map((e) => [e.entity_type, e.data_category]),
      );
      const mismatches: string[] = [];

      for (const [entity_type, frontend_category] of Object.entries(
        ENTITY_DATA_CATEGORY_MAP,
      )) {
        const backend_category = backend_map.get(
          entity_type as SharedEntityType,
        );

        if (backend_category !== frontend_category) {
          mismatches.push(
            `${entity_type}: frontend="${frontend_category}" backend="${backend_category || "MISSING"}"`,
          );
        }
      }

      expect(mismatches).toEqual([]);
    });

    it("backend and frontend have the same set of entity types", () => {
      const backend_entities = new Set(
        SHARED_ENTITY_CATEGORIES.map((e) => e.entity_type),
      );
      const frontend_entities = new Set(Object.keys(ENTITY_DATA_CATEGORY_MAP));

      const only_in_backend = [...backend_entities].filter(
        (e) => !frontend_entities.has(e),
      );
      const only_in_frontend = [...frontend_entities].filter(
        (e) => !backend_entities.has(e as SharedEntityType),
      );

      expect(only_in_backend).toEqual([]);
      expect(only_in_frontend).toEqual([]);
    });
  });

  describe("role and category completeness", () => {
    it("backend defines all roles that frontend uses", () => {
      const frontend_roles = Object.keys(DATA_PERMISSION_MAP);
      const backend_roles = new Set(ALL_ROLES);

      const missing_from_backend = frontend_roles.filter(
        (r) => !backend_roles.has(r as (typeof ALL_ROLES)[number]),
      );

      expect(missing_from_backend).toEqual([]);
    });

    it("backend defines all categories that frontend uses", () => {
      const frontend_categories = new Set<string>();
      for (const role_perms of Object.values(DATA_PERMISSION_MAP)) {
        for (const category of Object.keys(role_perms)) {
          frontend_categories.add(category);
        }
      }
      const backend_categories = new Set(ALL_CATEGORIES);

      const missing_from_backend = [...frontend_categories].filter(
        (c) => !backend_categories.has(c as (typeof ALL_CATEGORIES)[number]),
      );

      expect(missing_from_backend).toEqual([]);
    });
  });
});
