import { describe, expect, it } from "vitest";

import {
  create_none_option,
  create_some_option,
  option_from_document,
  OptionStatus,
} from "./Option";

describe("Option", () => {
  it("wraps a present value", () => {
    expect(create_some_option(5)).toEqual({
      status: OptionStatus.SOME,
      value: 5,
    });
  });

  it("represents absence without a sentinel", () => {
    expect(create_none_option()).toEqual({ status: OptionStatus.NONE });
  });

  it("accepts plain document objects", () => {
    expect(option_from_document({ id: "team_1" })).toEqual({
      status: OptionStatus.SOME,
      value: { id: "team_1" },
    });
  });

  it("rejects missing values, primitives and arrays as documents", () => {
    expect(option_from_document(undefined).status).toBe(OptionStatus.NONE);
    expect(option_from_document("team_1").status).toBe(OptionStatus.NONE);
    expect(option_from_document([{ id: "team_1" }]).status).toBe(
      OptionStatus.NONE,
    );
  });
});
