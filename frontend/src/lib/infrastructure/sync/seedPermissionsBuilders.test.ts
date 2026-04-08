import { describe, expect, it } from "vitest";

import {
  build_entity_categories,
  build_role_permissions,
  build_sidebar_menu_items,
} from "../../../../convex/seed_permissions_builders";
import {
  ALL_CATEGORIES,
  ALL_ROLES,
  SHARED_ENTITY_CATEGORIES,
  SHARED_ROLE_PERMISSIONS,
} from "../../../../convex/shared_permission_definitions";
import { SIDEBAR_ICONS } from "../../../../convex/sidebar_icons";
import { SIDEBAR_MENU_SEED_ITEMS } from "../../../../convex/sidebar_menu_seed_data";

describe("seed_permissions_builders", () => {
  it("builds every role permission combination from the shared source", () => {
    const built_role_permissions = build_role_permissions();
    expect(built_role_permissions).toHaveLength(
      ALL_ROLES.length * ALL_CATEGORIES.length,
    );
    for (const role of ALL_ROLES) {
      for (const data_category of ALL_CATEGORIES) {
        expect(built_role_permissions).toContainEqual({
          role,
          data_category,
          ...SHARED_ROLE_PERMISSIONS[role][data_category],
        });
      }
    }
  });

  it("builds entity categories from the shared definition list", () => {
    expect(build_entity_categories()).toEqual(
      SHARED_ENTITY_CATEGORIES.map((entry) => ({
        entity_type: entry.entity_type,
        data_category: entry.data_category,
      })),
    );
  });

  it("maps sidebar seed tuples into menu items with icons", () => {
    expect(build_sidebar_menu_items()).toEqual(
      SIDEBAR_MENU_SEED_ITEMS.map(
        ([
          role,
          group_name,
          group_order,
          item_name,
          item_href,
          icon_key,
          item_order,
        ]) => ({
          role,
          group_name,
          group_order,
          item_name,
          item_href,
          item_icon: SIDEBAR_ICONS[icon_key],
          item_order,
        }),
      ),
    );
  });
});
