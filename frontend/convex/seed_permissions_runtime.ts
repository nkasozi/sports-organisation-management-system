import type { MutationCtx } from "./_generated/server";
import {
  build_entity_categories,
  build_role_permissions,
  build_sidebar_menu_items,
} from "./seed_permissions_builders";

const SEED_TABLE_NAME = {
  entity_data_categories: "entity_data_categories",
  role_permissions: "role_permissions",
  sidebar_menu_items: "sidebar_menu_items",
} as const;

type SeedTableName = (typeof SEED_TABLE_NAME)[keyof typeof SEED_TABLE_NAME];

interface SeedPermissionsCounts {
  entity_categories_seeded: number;
  menu_items_seeded: number;
  role_permissions_seeded: number;
}

async function clear_seed_table(
  ctx: MutationCtx,
  table_name: SeedTableName,
): Promise<void> {
  for (const current_record of await ctx.db.query(table_name).collect()) {
    await ctx.db.delete(current_record._id);
  }
}

export async function reseed_permissions(
  ctx: MutationCtx,
): Promise<SeedPermissionsCounts> {
  const timestamp = new Date().toISOString();
  let role_permissions_seeded = 0;
  let entity_categories_seeded = 0;
  let menu_items_seeded = 0;
  await clear_seed_table(ctx, SEED_TABLE_NAME.role_permissions);
  for (const permission of build_role_permissions()) {
    await ctx.db.insert(SEED_TABLE_NAME.role_permissions, {
      ...permission,
      created_at: timestamp,
      updated_at: timestamp,
    });
    role_permissions_seeded++;
  }
  await clear_seed_table(ctx, SEED_TABLE_NAME.entity_data_categories);
  for (const category of build_entity_categories()) {
    await ctx.db.insert(SEED_TABLE_NAME.entity_data_categories, {
      ...category,
      created_at: timestamp,
      updated_at: timestamp,
    });
    entity_categories_seeded++;
  }
  await clear_seed_table(ctx, SEED_TABLE_NAME.sidebar_menu_items);
  for (const item of build_sidebar_menu_items()) {
    await ctx.db.insert(SEED_TABLE_NAME.sidebar_menu_items, {
      ...item,
      created_at: timestamp,
      updated_at: timestamp,
    });
    menu_items_seeded++;
  }
  return {
    role_permissions_seeded,
    entity_categories_seeded,
    menu_items_seeded,
  };
}
