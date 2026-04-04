import { describe, expect, it } from "vitest";

const REQUIRED_USER_FIELDS = [
  "id",
  "email",
  "first_name",
  "last_name",
  "role",
] as const;

function validate_stored_user(
  parsed: unknown,
): boolean {
  if (typeof parsed !== "object" || parsed === null) return false;
  const record = parsed as Record<string, unknown>;
  return REQUIRED_USER_FIELDS.every(
    (field) => typeof record[field] === "string" && record[field] !== "",
  );
}

describe("currentUser schema validation", () => {
  it("accepts valid user object", () => {
    const valid_user = {
      id: "user_123",
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
    };
    expect(validate_stored_user(valid_user)).toBe(true);
  });

  it("accepts user with optional profile_picture_base64", () => {
    const user_with_picture = {
      id: "user_123",
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
      profile_picture_base64: "data:image/png;base64,abc123",
    };
    expect(validate_stored_user(user_with_picture)).toBe(true);
  });

  it("rejects null", () => {
    expect(validate_stored_user(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validate_stored_user(undefined)).toBe(false);
  });

  it("rejects string", () => {
    expect(validate_stored_user("not an object")).toBe(false);
  });

  it("rejects number", () => {
    expect(validate_stored_user(42)).toBe(false);
  });

  it("rejects array", () => {
    expect(validate_stored_user(["not", "an", "object"])).toBe(false);
  });

  it("rejects object missing id", () => {
    const missing_id = {
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
    };
    expect(validate_stored_user(missing_id)).toBe(false);
  });

  it("rejects object missing email", () => {
    const missing_email = {
      id: "user_123",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
    };
    expect(validate_stored_user(missing_email)).toBe(false);
  });

  it("rejects object missing role", () => {
    const missing_role = {
      id: "user_123",
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
    };
    expect(validate_stored_user(missing_role)).toBe(false);
  });

  it("rejects object with empty string fields", () => {
    const empty_fields = {
      id: "",
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
    };
    expect(validate_stored_user(empty_fields)).toBe(false);
  });

  it("rejects object with non-string id", () => {
    const numeric_id = {
      id: 123,
      email: "test@example.com",
      first_name: "John",
      last_name: "Doe",
      role: "org_admin",
    };
    expect(validate_stored_user(numeric_id)).toBe(false);
  });

  it("rejects empty object", () => {
    expect(validate_stored_user({})).toBe(false);
  });
});
