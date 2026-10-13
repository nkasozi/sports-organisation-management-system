import { SIDEBAR_MENU_PRIMARY_SEED_ITEMS } from "./sidebar_menu_seed_data_primary";
import { SIDEBAR_MENU_SECONDARY_SEED_ITEMS } from "./sidebar_menu_seed_data_secondary";

export const SIDEBAR_MENU_SEED_ITEMS = [
  ...SIDEBAR_MENU_PRIMARY_SEED_ITEMS,
  ...SIDEBAR_MENU_SECONDARY_SEED_ITEMS,
] as const;
