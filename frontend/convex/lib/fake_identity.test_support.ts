export const FakeIdentityStatus = {
  ANONYMOUS: "anonymous",
  AUTHENTICATED: "authenticated",
} as const;

export type FakeIdentity =
  | { status: typeof FakeIdentityStatus.ANONYMOUS }
  | {
      status: typeof FakeIdentityStatus.AUTHENTICATED;
      email: string;
      subject: string;
    };

export function authenticated_identity(email: string): FakeIdentity {
  return {
    status: FakeIdentityStatus.AUTHENTICATED,
    email,
    subject: `subject_${email}`,
  };
}

export const ANONYMOUS_IDENTITY: FakeIdentity = {
  status: FakeIdentityStatus.ANONYMOUS,
};
