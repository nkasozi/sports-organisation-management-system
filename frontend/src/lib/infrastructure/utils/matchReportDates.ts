import type { Fixture } from "$lib/core/entities/Fixture";
import { parse_local_calendar_date } from "$lib/core/entities/LocalCalendarDate";
import { OptionStatus } from "$lib/core/types/Option";

export function resolve_fixture_year(fixture: Fixture): string {
  const scheduled_date = parse_local_calendar_date(fixture.scheduled_date);
  const reference_date =
    scheduled_date.status === OptionStatus.SOME
      ? scheduled_date.value
      : new Date();
  return reference_date.getFullYear().toString();
}
