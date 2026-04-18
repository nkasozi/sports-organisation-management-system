import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import SidebarHeader from "./SidebarHeader.svelte";

describe("SidebarHeader", () => {
  it("keeps the expanded custom logo from shrinking or stretching", () => {
    const rendered_markup = render(SidebarHeader, {
      props: {
        sidebar_open: true,
        has_custom_logo: true,
        organization_logo_url: "/uganda-hockey-logo.svg",
        organization_name: "Uganda Hockey Association",
        on_close_sidebar: () => {},
      },
    }).body;

    expect(rendered_markup).toContain("shrink-0");
    expect(rendered_markup).toContain("object-contain");
  });
});
