import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import {
  CHECK_STATUS,
  FIXTURE_START_CHECK_NAME,
} from "$lib/core/services/FixtureStartChecksConstants";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

interface LiveGameCheckFixLink {
  href: string;
  label: string;
}

const FIXTURE_DETAILS_SETUP_ROUTE = "/fixture-details-setup";
const FIXTURE_ID_PARAMETER = "fixture_id";
const FIXTURE_DETAILS_LINK_LABEL = "Set up fixture details";

function build_fixture_details_setup_link(
  fixture_id: string,
): LiveGameCheckFixLink {
  const parameters = new URLSearchParams({
    [FIXTURE_ID_PARAMETER]: fixture_id,
  });
  return {
    href: `${FIXTURE_DETAILS_SETUP_ROUTE}?${parameters.toString()}`,
    label: FIXTURE_DETAILS_LINK_LABEL,
  };
}

export function get_live_game_check_fix_link(
  check: PreFlightCheck,
  fixture_id: string,
): Option<LiveGameCheckFixLink> {
  const needs_fixture_details =
    check.check_name === FIXTURE_START_CHECK_NAME.OFFICIALS &&
    check.status === CHECK_STATUS.FAILED &&
    fixture_id.length > 0;
  return needs_fixture_details
    ? create_some_option(build_fixture_details_setup_link(fixture_id))
    : create_none_option();
}
