import { describe, expect, it } from "vitest";

import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  predicate_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";

type Item = { id: string; name: string; status: string; active: boolean };
type ItemFilter = {
  name_contains?: string;
  status?: string;
  active?: boolean;
  min_id?: string;
};

const ITEMS: Item[] = [
  { id: "1", name: "Alpha", status: "on", active: true },
  { id: "2", name: "Bravo", status: "off", active: false },
  { id: "3", name: "alphabet", status: "off", active: true },
];

const RULES: EntityFilterRule<Item, ItemFilter>[] = [
  text_contains_rule("name_contains", (item) => item.name),
  equals_rule("status"),
  equals_rule("active", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  predicate_rule("min_id", (item, filter) => item.id >= String(filter.min_id)),
];

function ids(filter: ItemFilter): string[] {
  return apply_entity_filter_rules(ITEMS, filter, RULES).map((item) => item.id);
}

describe("apply_entity_filter_rules", () => {
  it("returns every entity when no rule is active", () => {
    expect(ids({})).toEqual(["1", "2", "3"]);
  });

  it("matches text case-insensitively", () => {
    expect(ids({ name_contains: "ALPHA" })).toEqual(["1", "3"]);
  });

  it("ignores falsy values for truthy-activated rules", () => {
    expect(ids({ status: "" })).toEqual(["1", "2", "3"]);
    expect(ids({ name_contains: "" })).toEqual(["1", "2", "3"]);
  });

  it("applies key-present rules even for false values", () => {
    expect(ids({ active: false })).toEqual(["2"]);
  });

  it("combines all active rules", () => {
    expect(
      ids({ name_contains: "alpha", status: "off", active: true }),
    ).toEqual(["3"]);
  });

  it("supports custom predicates", () => {
    expect(ids({ min_id: "2" })).toEqual(["2", "3"]);
  });

  it("does not mutate the input array", () => {
    const input = [...ITEMS];

    apply_entity_filter_rules(input, { status: "on" }, RULES);

    expect(input).toEqual(ITEMS);
  });
});
