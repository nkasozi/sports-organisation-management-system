import { render } from "svelte/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

import Footer from "./Footer.svelte";

const footer_component_store_state = vi.hoisted(() => {
  let sidebar_menu_groups: SidebarMenuGroup[] = [];
  const branding_value = {
    organization_logo_url: "",
    organization_name: "Sport-Sync",
    organization_tagline: "Professional sports management platform.",
    social_media_links: [],
    show_panel_borders: false,
    footer_pattern: "solid_color",
    background_pattern_url: "",
  };

  return {
    reset(): void {
      sidebar_menu_groups = [];
    },
    set_sidebar_menu_groups(value: SidebarMenuGroup[]): void {
      sidebar_menu_groups = value;
    },
    branding_store: {
      subscribe(
        subscriber: (value: typeof branding_value) => void,
      ): () => void {
        subscriber(branding_value);
        return () => {};
      },
    },
    sidebar_menu_items_store: {
      subscribe(subscriber: (value: SidebarMenuGroup[]) => void): () => void {
        subscriber(sidebar_menu_groups);
        return () => {};
      },
    },
  };
});

vi.mock("$lib/presentation/stores/branding", () => ({
  branding_store: footer_component_store_state.branding_store,
}));

vi.mock("$lib/presentation/stores/authDerivedStores", () => ({
  sidebar_menu_items: footer_component_store_state.sidebar_menu_items_store,
}));

describe("Footer quick links", () => {
  beforeEach(() => {
    footer_component_store_state.reset();
  });

  it("renders quick links from the sidebar menu in sidebar order", () => {
    footer_component_store_state.set_sidebar_menu_groups([
      {
        group_name: "Primary",
        items: [
          { name: "Alpha", href: "/alpha", icon: "alpha-icon" },
          { name: "Beta", href: "/beta", icon: "beta-icon" },
        ],
      },
      {
        group_name: "Secondary",
        items: [
          { name: "Gamma", href: "/gamma", icon: "gamma-icon" },
          { name: "Delta", href: "/delta", icon: "delta-icon" },
          { name: "Epsilon", href: "/epsilon", icon: "epsilon-icon" },
        ],
      },
    ]);

    const rendered_footer_markup = render(Footer).body;

    expect(rendered_footer_markup).toContain('href="/alpha"');
    expect(rendered_footer_markup).toContain('href="/beta"');
    expect(rendered_footer_markup).toContain('href="/gamma"');
    expect(rendered_footer_markup).toContain('href="/delta"');
    expect(rendered_footer_markup).not.toContain('href="/epsilon"');
    expect(rendered_footer_markup).not.toContain('href="/organizations"');
    expect(rendered_footer_markup).not.toContain('href="/fixtures"');
  });
});
