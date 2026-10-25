import { describe, expect, it } from "vitest";

import {
  CONCEPT_GUIDE_CATALOG,
  get_concept_definition,
} from "./conceptGuideCatalog";
import { get_concept_explanation } from "./conceptGuideExplanations";

describe("concept guide catalog", () => {
  it("explains every concept with at least two real-world scenarios", () => {
    for (const concept of CONCEPT_GUIDE_CATALOG) {
      const explanation = get_concept_explanation(concept.id);
      expect(explanation.what_it_is, concept.id).not.toBe("");
      expect(explanation.why_it_matters, concept.id).not.toBe("");
      expect(explanation.scenarios.length, concept.id).toBeGreaterThanOrEqual(
        2,
      );
    }
  });

  it("describes every connection from both sides", () => {
    for (const concept of CONCEPT_GUIDE_CATALOG) {
      for (const unlocked of concept.unlocks) {
        const needed_ids = get_concept_definition(
          unlocked.concept_id,
        ).needs.map((need) => need.concept_id);
        expect(
          needed_ids,
          `${unlocked.concept_id} needs ${concept.id}`,
        ).toContain(concept.id);
      }
    }
  });
});
