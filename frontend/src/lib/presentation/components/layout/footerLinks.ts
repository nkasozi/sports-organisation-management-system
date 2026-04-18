import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

export interface FooterLink {
  href: string;
  label: string;
}

const MAX_DYNAMIC_FOOTER_LINK_COUNT = 4;

export function create_footer_links_from_sidebar_menu(
  sidebar_menu_groups: SidebarMenuGroup[],
): FooterLink[] {
  const seen_hrefs: Set<string> = new Set<string>();
  const footer_links: FooterLink[] = [];

  for (const sidebar_menu_group of sidebar_menu_groups) {
    for (const sidebar_menu_item of sidebar_menu_group.items) {
      if (
        sidebar_menu_item.href.length === 0 ||
        sidebar_menu_item.name.length === 0 ||
        seen_hrefs.has(sidebar_menu_item.href)
      ) {
        continue;
      }

      seen_hrefs.add(sidebar_menu_item.href);
      footer_links.push({
        href: sidebar_menu_item.href,
        label: sidebar_menu_item.name,
      });

      if (footer_links.length === MAX_DYNAMIC_FOOTER_LINK_COUNT) {
        return footer_links;
      }
    }
  }

  return footer_links;
}
