import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import FooterBottomBar from "./FooterBottomBar.svelte";
import FooterBrandPanel from "./FooterBrandPanel.svelte";
import FooterLinkPanel from "./FooterLinkPanel.svelte";

const ORGANIZATION_NAME = "Sports Organisation";
const ORGANIZATION_TAGLINE = "Supporting competitions, teams, and fixtures.";
const FOOTER_LINK_TITLE = "Support";
const FOOTER_LINKS = [{ href: "/support", label: "Support Center" }];
const FOOTER_LIGHT_TEXT_CLASS = "text-white";
const FOOTER_BLACK_TEXT_CLASS = "text-black";
const FOOTER_DARK_TEXT_CLASS = "text-gray-800";
const FOOTER_COPYRIGHT_LABEL = "All rights reserved.";
const GLASS_PANEL_RADIUS_CLASS = "rounded-[0.175rem]";
const LEGACY_GLASS_PANEL_RADIUS_CLASS = "backdrop-blur-sm rounded-lg";

describe("src/lib/presentation/components/layout footer color classes", () => {
  it("renders footer panels without dark text utility classes", () => {
    const rendered_brand_panel_markup = render(FooterBrandPanel, {
      props: {
        has_custom_logo: false,
        organization_logo_url: "",
        organization_name: ORGANIZATION_NAME,
        organization_tagline: ORGANIZATION_TAGLINE,
        social_media_links: [],
        show_panel_borders: false,
      },
    }).body;
    const rendered_link_panel_markup = render(FooterLinkPanel, {
      props: {
        title: FOOTER_LINK_TITLE,
        links: FOOTER_LINKS,
        show_panel_borders: false,
      },
    }).body;
    const rendered_bottom_bar_markup = render(FooterBottomBar, {
      props: {
        current_year: 2025,
        organization_name: ORGANIZATION_NAME,
        show_panel_borders: false,
      },
    }).body;

    expect(rendered_brand_panel_markup).toContain(FOOTER_LIGHT_TEXT_CLASS);
    expect(rendered_link_panel_markup).toContain(FOOTER_LIGHT_TEXT_CLASS);
    expect(rendered_bottom_bar_markup).toContain(FOOTER_LIGHT_TEXT_CLASS);
    expect(rendered_brand_panel_markup).toContain(GLASS_PANEL_RADIUS_CLASS);
    expect(rendered_link_panel_markup).toContain(GLASS_PANEL_RADIUS_CLASS);
    expect(rendered_bottom_bar_markup).toContain(GLASS_PANEL_RADIUS_CLASS);

    expect(rendered_brand_panel_markup).not.toContain(FOOTER_BLACK_TEXT_CLASS);
    expect(rendered_brand_panel_markup).not.toContain(FOOTER_DARK_TEXT_CLASS);
    expect(rendered_link_panel_markup).not.toContain(FOOTER_DARK_TEXT_CLASS);
    expect(rendered_bottom_bar_markup).not.toContain(FOOTER_DARK_TEXT_CLASS);
    expect(rendered_brand_panel_markup).not.toContain(
      LEGACY_GLASS_PANEL_RADIUS_CLASS,
    );
    expect(rendered_link_panel_markup).not.toContain(
      LEGACY_GLASS_PANEL_RADIUS_CLASS,
    );
    expect(rendered_bottom_bar_markup).not.toContain(
      LEGACY_GLASS_PANEL_RADIUS_CLASS,
    );
    expect(rendered_bottom_bar_markup).toContain(FOOTER_COPYRIGHT_LABEL);
  });
});
