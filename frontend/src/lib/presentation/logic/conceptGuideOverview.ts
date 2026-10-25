import {
  type ConceptGuideSources,
  load_concept_guide_snapshot,
} from "./conceptGuideLoader";
import {
  choose_guide_organization_id,
  load_guide_competitions,
  load_guide_organizations,
} from "./conceptGuidePageState";
import {
  CONCEPT_ID,
  type ConceptGuideSnapshot,
  type ConceptId,
} from "./conceptGuideTypes";

const ENTITY_TYPE_CONCEPTS: Readonly<Record<string, ConceptId>> = {
  organization: CONCEPT_ID.ORGANIZATION,
  venue: CONCEPT_ID.VENUES,
  team: CONCEPT_ID.TEAMS,
  player: CONCEPT_ID.PLAYERS,
  playerteammembership: CONCEPT_ID.PLAYERS,
  official: CONCEPT_ID.OFFICIALS,
  competition: CONCEPT_ID.COMPETITION,
  competitionstage: CONCEPT_ID.STAGES,
  competitionteam: CONCEPT_ID.ENTRIES,
  fixture: CONCEPT_ID.FIXTURES,
  fixturedetailssetup: CONCEPT_ID.FIXTURE_SETUP,
  fixturelineup: CONCEPT_ID.LINEUPS,
};

export function find_concept_for_entity_type(
  entity_type: string,
): ConceptId | false {
  return (
    ENTITY_TYPE_CONCEPTS[entity_type.toLowerCase().replace(/[\s_-]/g, "")] ??
    false
  );
}

export async function load_default_concept_snapshot(
  sources: ConceptGuideSources,
  preferred_organization_id: string,
): Promise<ConceptGuideSnapshot> {
  const organization_id = choose_guide_organization_id(
    await load_guide_organizations(sources),
    preferred_organization_id,
  );
  const [competition] = organization_id
    ? await load_guide_competitions(sources, organization_id)
    : [];
  return load_concept_guide_snapshot(
    sources,
    organization_id,
    competition ?? false,
  );
}
