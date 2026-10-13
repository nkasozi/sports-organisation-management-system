import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

const LIVE_GAMES_ROUTE = "/live-games";
const START_FIXTURE_PARAMETER = "start_fixture_id";
const ORGANIZATION_PARAMETER = "organization_id";
const NO_ORGANIZATION_ID = "";

export function build_live_games_resume_start_url(
  fixture_id: string,
  organization_id: string,
): string {
  const parameters = new URLSearchParams({
    [START_FIXTURE_PARAMETER]: fixture_id,
    [ORGANIZATION_PARAMETER]: organization_id,
  });
  return `${LIVE_GAMES_ROUTE}?${parameters.toString()}`;
}

export function select_live_games_organization_id(
  organizations: readonly { id: string }[],
  search_parameters: URLSearchParams,
): string {
  const requested_id = search_parameters.get(ORGANIZATION_PARAMETER);
  const requested = organizations.filter(
    (organization) => organization.id === requested_id,
  );
  const [selected] = [...requested, ...organizations];
  return selected ? selected.id : NO_ORGANIZATION_ID;
}

export function find_fixture_to_resume_starting(
  search_parameters: URLSearchParams,
  fixtures: Fixture[],
): Option<Fixture> {
  const fixture_id = search_parameters.get(START_FIXTURE_PARAMETER) ?? "";
  const fixture = fixtures.find(
    (candidate) =>
      candidate.id === fixture_id &&
      candidate.status === FIXTURE_STATUS.SCHEDULED,
  );
  return fixture ? create_some_option(fixture) : create_none_option();
}

const START_RESUMED_EVENT = "live_games_start_resumed_after_fixture_details";
const START_RESUMED_MESSAGE = "[LiveGames] Resuming game start";

export function resume_start_if_requested(command: {
  search_parameters: URLSearchParams;
  fixtures: Fixture[];
  request_start: (fixture: Fixture) => unknown;
  clear_request: () => unknown;
}): boolean {
  const fixture_to_resume = find_fixture_to_resume_starting(
    command.search_parameters,
    command.fixtures,
  );
  switch (fixture_to_resume.status) {
    case OptionStatus.NONE:
      return false;
    case OptionStatus.SOME:
      console.log(START_RESUMED_MESSAGE, {
        event: START_RESUMED_EVENT,
        fixture_id: fixture_to_resume.value.id,
      });
      command.clear_request();
      command.request_start(fixture_to_resume.value);
      return true;
  }
}
