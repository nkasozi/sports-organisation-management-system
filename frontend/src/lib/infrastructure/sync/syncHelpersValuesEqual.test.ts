import { describe, expect, it } from "vitest";

import { values_equal } from "./syncHelpers.test_support";

describe("values_equal", () => {
  it("returns true for identical primitives", () => {
    expect(values_equal("hello", "hello")).toBe(true);
    expect(values_equal(42, 42)).toBe(true);
    expect(values_equal(true, true)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(values_equal("hello", "world")).toBe(false);
    expect(values_equal(42, 43)).toBe(false);
    expect(values_equal(true, false)).toBe(false);
  });

  it("treats missing and undefined values as equal", () => {
    const missing_value = JSON.parse("null");

    expect(values_equal(missing_value, void 0)).toBe(true);
    expect(values_equal(void 0, missing_value)).toBe(true);
  });

  it("returns true for identical missing values", () => {
    const first_missing_value = JSON.parse("null");
    const second_missing_value = JSON.parse("null");

    expect(values_equal(first_missing_value, second_missing_value)).toBe(true);
  });

  it("returns true for identical undefined values", () => {
    expect(values_equal(void 0, void 0)).toBe(true);
  });

  it("returns false for different primitive types", () => {
    expect(values_equal("42", 42)).toBe(false);
    expect(values_equal(true, "true")).toBe(false);
  });

  it("treats empty array and empty object as equal in current implementation", () => {
    expect(values_equal([], {})).toBe(true);
  });

  it("returns true for identical arrays", () => {
    expect(values_equal([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(values_equal(["a", "b"], ["a", "b"])).toBe(true);
    expect(values_equal([], [])).toBe(true);
  });

  it("returns false for arrays with different elements", () => {
    expect(values_equal([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(values_equal(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("returns false for arrays with different lengths", () => {
    expect(values_equal([1, 2], [1, 2, 3])).toBe(false);
    expect(values_equal([1, 2, 3], [1, 2])).toBe(false);
  });

  it("returns true for identical nested arrays", () => {
    expect(
      values_equal(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 4],
        ],
      ),
    ).toBe(true);
  });

  it("returns false for different nested arrays", () => {
    expect(
      values_equal(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 5],
        ],
      ),
    ).toBe(false);
  });

  it("returns true for identical objects", () => {
    expect(values_equal({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(values_equal({}, {})).toBe(true);
  });

  it("returns false for objects with different values", () => {
    expect(values_equal({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false for objects with different keys", () => {
    expect(values_equal({ a: 1 }, { b: 1 })).toBe(false);
    expect(values_equal({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("returns true for identical nested objects", () => {
    expect(
      values_equal(
        { outer: { inner: "value" } },
        { outer: { inner: "value" } },
      ),
    ).toBe(true);
  });

  it("returns false for different nested objects", () => {
    expect(
      values_equal(
        { outer: { inner: "value1" } },
        { outer: { inner: "value2" } },
      ),
    ).toBe(false);
  });

  it("handles mixed nested structures", () => {
    const obj1 = { arr: [1, 2], nested: { key: "val" } };
    const obj2 = { arr: [1, 2], nested: { key: "val" } };
    const obj3 = { arr: [1, 3], nested: { key: "val" } };

    expect(values_equal(obj1, obj2)).toBe(true);
    expect(values_equal(obj1, obj3)).toBe(false);
  });
});
