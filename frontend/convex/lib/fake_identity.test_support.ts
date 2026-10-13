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
      email_verified: boolean;
    };

export function authenticated_identity(email: string): FakeIdentity {
  return {
    status: FakeIdentityStatus.AUTHENTICATED,
    email,
    subject: `subject_${email}`,
    email_verified: true,
  };
}

export function unverified_identity(email: string): FakeIdentity {
  return {
    status: FakeIdentityStatus.AUTHENTICATED,
    email,
    subject: `subject_${email}`,
    email_verified: false,
  };
}

export const ANONYMOUS_IDENTITY: FakeIdentity = {
  status: FakeIdentityStatus.ANONYMOUS,
};
