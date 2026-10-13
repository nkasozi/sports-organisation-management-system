import { type Mock, vi } from "vitest";

export interface FakeClerkSession {
  id: string;
  getToken: Mock;
}

export interface FakeClerk {
  loaded: boolean;
  user: Record<string, unknown>;
  session: FakeClerkSession | false;
  addListener: Mock;
  signOut: Mock;
}

export function create_fake_clerk(
  overrides: Partial<Pick<FakeClerk, "loaded" | "session">> = {},
): FakeClerk {
  return {
    loaded: true,
    user: {
      id: "user_1",
      emailAddresses: [{ emailAddress: "ann@example.com" }],
      primaryEmailAddress: { emailAddress: "ann@example.com" },
      fullName: "Ann Lee",
      firstName: "Ann",
      lastName: "Lee",
      imageUrl: "img.png",
    },
    session: { id: "sess_1", getToken: vi.fn().mockResolvedValue("tok") },
    addListener: vi.fn(),
    signOut: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function install_clerk_globals(clerk: FakeClerk | false): boolean {
  vi.stubGlobal("window", clerk ? { Clerk: clerk } : {});
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
    callback();
    return 1;
  });
  return true;
}
