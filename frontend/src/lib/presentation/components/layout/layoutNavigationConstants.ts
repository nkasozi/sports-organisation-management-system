export const NAVIGATION_PATH = {
  HOME: "/",
  CALENDAR: "/calendar",
} as const;

const NAVIGATION_PATH_SEPARATOR = "/";
export const HOME_NAVIGATION_GROUP_NAME = "Home";
export const DESKTOP_SIDEBAR_BREAKPOINT_PX = 1024;

export function is_navigation_item_active(
  item_href: string,
  current_path: string,
): boolean {
  if (item_href === NAVIGATION_PATH.HOME)
    return current_path === NAVIGATION_PATH.HOME;
  return (
    current_path === item_href ||
    current_path.startsWith(`${item_href}${NAVIGATION_PATH_SEPARATOR}`)
  );
}
