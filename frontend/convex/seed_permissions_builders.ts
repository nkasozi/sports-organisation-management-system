import {
  ALL_CATEGORIES,
  ALL_ROLES,
  SHARED_ENTITY_CATEGORIES,
  SHARED_ROLE_PERMISSIONS,
  type SharedDataCategory,
  type SharedUserRole,
} from "./shared_permission_definitions";
import { SIDEBAR_ICONS } from "./sidebar_icons";
import { SIDEBAR_MENU_SEED_ITEMS } from "./sidebar_menu_seed_data";

type UserRole = SharedUserRole;
type DataCategory = SharedDataCategory;

interface RolePermission {
  role: UserRole;
  data_category: DataCategory;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface EntityCategory {
  entity_type: string;
  data_category: DataCategory;
}

interface MenuItem {
  role: UserRole;
  group_name: string;
  group_order: number;
  item_name: string;
  item_href: string;
  item_icon: string;
  item_order: number;
}

export function build_role_permissions(): RolePermission[] {
  return ALL_ROLES.flatMap((role) =>
    ALL_CATEGORIES.map((data_category) => ({
      role,
      data_category,
      ...SHARED_ROLE_PERMISSIONS[role][data_category],
    })),
  );
}

export function build_entity_categories(): EntityCategory[] {
  return SHARED_ENTITY_CATEGORIES.map((entry) => ({
    entity_type: entry.entity_type,
    data_category: entry.data_category,
  }));
}

export function build_sidebar_menu_items(): MenuItem[] {
  return SIDEBAR_MENU_SEED_ITEMS.map(
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
  );
}
