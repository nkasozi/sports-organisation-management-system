import { get_concept_definition } from "./conceptGuideCatalog";
import {
  CONCEPT_STATUS,
  type ConceptId,
  type ConceptProgress,
} from "./conceptGuideTypes";

export interface ConceptNeed {
  concept_id: ConceptId;
  name: string;
  reason: string;
  route: string;
  is_met: boolean;
}

export function list_concept_needs(
  concept_id: ConceptId,
  progress: Record<ConceptId, ConceptProgress>,
): ConceptNeed[] {
  return get_concept_definition(concept_id).needs.map((need) => {
    const needed = get_concept_definition(need.concept_id);
    return {
      concept_id: need.concept_id,
      name: needed.name,
      reason: need.reason,
      route: needed.route,
      is_met: progress[need.concept_id].status === CONCEPT_STATUS.DONE,
    };
  });
}
