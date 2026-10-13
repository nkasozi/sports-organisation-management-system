import type { Fixture } from "../entities/Fixture";
import { FIXTURE_DISPLAY_FALLBACK_NAME } from "./FixtureUseCaseConstants";

export function build_fixture_display_name(fixture: Fixture): string {
  return (
    `${fixture.venue || FIXTURE_DISPLAY_FALLBACK_NAME} - Round ${fixture.round_number || ""}`.trim() ||
    fixture.id
  );
}
