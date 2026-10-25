import { COMPETITION_CONCEPTS } from "./conceptGuideCatalogCompetition";
import { MATCH_DAY_CONCEPTS } from "./conceptGuideCatalogMatchDay";
import { SETUP_CONCEPTS } from "./conceptGuideCatalogSetup";
import type {
  ConceptDefinition,
  ConceptId,
  ConceptLane,
} from "./conceptGuideTypes";

export const CONCEPT_GUIDE_CATALOG: ConceptDefinition[] = [
  ...SETUP_CONCEPTS,
  ...COMPETITION_CONCEPTS,
  ...MATCH_DAY_CONCEPTS,
];

const CONCEPTS_BY_ID = Object.fromEntries(
  CONCEPT_GUIDE_CATALOG.map((concept) => [concept.id, concept]),
) as Record<ConceptId, ConceptDefinition>;

export function get_concept_definition(
  concept_id: ConceptId,
): ConceptDefinition {
  return CONCEPTS_BY_ID[concept_id];
}

export function get_concepts_in_lane(lane: ConceptLane): ConceptDefinition[] {
  return CONCEPT_GUIDE_CATALOG.filter((concept) => concept.lane === lane);
}
