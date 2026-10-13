import type { Clerk } from "@clerk/clerk-js";
import { describe, expect, it } from "vitest";

import { build_clerk_session_state } from "./clerkSessionStateBuilders";

function build_fake_clerk(user: Record<string, unknown>): Clerk {
  return {
    session: { id: "sess_1" },
    user: {
      id: "user_1",
      fullName: "Ann Lee",
      firstName: "Ann",
      lastName: "Lee",
      imageUrl: "img.png",
      ...user,
    },
  } as unknown as Clerk;
}

function read_email_address(clerk: Clerk): string {
  const session_state = build_clerk_session_state(clerk);
  return session_state.user_state.status === "present"
    ? session_state.user_state.user.email_address
    : "missing";
}

describe("build_clerk_session_state email selection", () => {
  it("uses the primary email address rather than the first listed email", () => {
    const clerk = build_fake_clerk({
      emailAddresses: [
        { emailAddress: "secondary@example.test" },
        { emailAddress: "primary@example.test" },
      ],
      primaryEmailAddress: { emailAddress: "primary@example.test" },
    });

    expect(read_email_address(clerk)).toBe("primary@example.test");
  });

  it("reports an empty email when the Clerk user has no primary email", () => {
    const clerk = build_fake_clerk({
      emailAddresses: [{ emailAddress: "unverified@example.test" }],
      primaryEmailAddress: null,
    });

    expect(read_email_address(clerk)).toBe("");
  });
});
