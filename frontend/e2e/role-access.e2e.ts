import { expect, test } from "@playwright/test";

import { sign_in_as } from "./support/clerkSignIn";
import { is_text } from "./support/convexAdmin";
import { E2E_PROFILES, type E2eRole } from "./support/profiles";
import {
  EXPECTED_ACCESS,
  type RoleAccess,
} from "./support/roleAccessExpectations";
import { open_from_sidebar, open_page, read_sidebar_links } from "./support/ui";

function matches(link: string, expected: string | RegExp): boolean {
  return is_text(expected) ? link === expected : expected.test(link);
}

for (const [role, access] of Object.entries(EXPECTED_ACCESS) as Array<
  [E2eRole, RoleAccess]
>) {
  test(`${role} sees exactly their own menu and is kept out of other areas`, async ({
    page,
  }) => {
    const profile = E2E_PROFILES[role];
    await sign_in_as(page, profile);
    await expect(page.getByRole("button", { name: "User menu" })).toContainText(
      access.role_label,
    );

    const links = await read_sidebar_links(page);
    const missing = access.sees.filter(
      (expected) => !links.some((link) => matches(link, expected)),
    );
    const unexpected = links.filter(
      (link) => !access.sees.some((expected) => matches(link, expected)),
    );
    expect({ missing, unexpected }).toEqual({ missing: [], unexpected: [] });

    for (const scoped of access.scoped_lists ?? []) {
      await open_from_sidebar(page, scoped.link);
      const content = page.locator("main");
      for (const name of scoped.shows)
        await expect(content.getByText(name).first()).toBeVisible();
      for (const name of scoped.hides)
        await expect(content.getByText(name)).toHaveCount(0);
    }

    for (const route of access.blocked_routes) {
      await open_page(page, route);
      await expect(
        page
          .getByText(/does not have access to the/)
          .or(page.getByText("You don't have access to this area"))
          .first(),
        `${role} should be turned away from ${route}`,
      ).toBeVisible();
      expect(new URL(page.url()).pathname).not.toBe(route);
    }
  });
}
