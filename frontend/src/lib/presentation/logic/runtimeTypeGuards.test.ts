import { describe, expect, it } from "vitest";

import {
  is_absent_value,
  is_blank_string_value,
  is_boolean_value,
  is_number_value,
  is_object_value,
  is_string_value,
} from "./runtimeTypeGuards";

describe("runtimeTypeGuards", () => {
  it("detects strings", () => {
    expect(is_string_value("abc")).toBe(true);
    expect(is_string_value(1)).toBe(false);
  });

  it("detects numbers", () => {
    expect(is_number_value(3)).toBe(true);
    expect(is_number_value("3")).toBe(false);
  });

  it("detects booleans", () => {
    expect(is_boolean_value(false)).toBe(true);
    expect(is_boolean_value(0)).toBe(false);
  });

  it("detects undefined", () => {
    expect(is_absent_value(undefined)).toBe(true);
    expect(is_absent_value(0)).toBe(false);
  });

  it("detects non-null objects only", () => {
    expect(is_object_value({ a: 1 })).toBe(true);
    expect(is_object_value([])).toBe(true);
    expect(is_object_value(JSON.parse("null"))).toBe(false);
    expect(is_object_value("x")).toBe(false);
  });

  it("treats non-strings and whitespace strings as blank", () => {
    expect(is_blank_string_value("  ")).toBe(true);
    expect(is_blank_string_value(5)).toBe(true);
    expect(is_blank_string_value(" a ")).toBe(false);
  });
});
