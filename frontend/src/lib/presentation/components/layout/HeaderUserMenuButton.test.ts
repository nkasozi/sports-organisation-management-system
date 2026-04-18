import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

import HeaderUserMenuButton from "./HeaderUserMenuButton.svelte";

const DUPLICATE_PADDING_CLASS_PATTERN =
  /p-2 rounded-md text-black hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200/g;

describe("HeaderUserMenuButton", () => {
  it("renders only one padded interactive layer so the header account panel stays vertically inset", () => {
    const rendered_markup = render(HeaderUserMenuButton, {
      props: {
        has_profile_picture: false,
        profile_picture_base64: "",
        current_profile_initials: "TM",
        current_profile_display_name: "Team Manager",
        current_profile_organization_name: "Uganda Hockey Association",
        user_menu_open: false,
        on_toggle_user_menu: () => {},
      },
    }).body;

    const padded_layer_matches = [
      ...rendered_markup.matchAll(DUPLICATE_PADDING_CLASS_PATTERN),
    ];

    expect(padded_layer_matches).toHaveLength(1);
  });
});
