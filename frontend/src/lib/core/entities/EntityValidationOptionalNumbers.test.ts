import { describe, expect, it } from "vitest";

import { parse_non_negative_integer_value } from "../types/DomainScalars";
import { check_optional_numeric_value } from "./EntityValidation";

const INVALID_MESSAGE = "Years of experience must be zero or greater";

describe("check_optional_numeric_value", () => {
  it.each([undefined, ""])(
    "accepts a value the user left blank (%s)",
    (blank_value) => {
      expect(
        check_optional_numeric_value(
          blank_value,
          parse_non_negative_integer_value,
          INVALID_MESSAGE,
        ),
      ).toEqual({ success: true, data: true });
    },
  );

  it("validates a provided number", () => {
    expect(
      check_optional_numeric_value(
        -3,
        parse_non_negative_integer_value,
        INVALID_MESSAGE,
      ),
    ).toEqual({ success: false, error: INVALID_MESSAGE });
    expect(
      check_optional_numeric_value(
        7,
        parse_non_negative_integer_value,
        INVALID_MESSAGE,
      ).success,
    ).toBe(true);
  });

  it("validates a number typed into a text input", () => {
    expect(
      check_optional_numeric_value(
        "12",
        parse_non_negative_integer_value,
        INVALID_MESSAGE,
      ).success,
    ).toBe(true);
    expect(
      check_optional_numeric_value(
        "abc",
        parse_non_negative_integer_value,
        INVALID_MESSAGE,
      ),
    ).toEqual({ success: false, error: INVALID_MESSAGE });
  });
});
