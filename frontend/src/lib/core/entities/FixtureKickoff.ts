const DATE_TIME_SEPARATOR = "T";
const START_OF_DAY_TIME = "00:00";

type ScheduledFixture = {
  scheduled_date: string;
  scheduled_time: string;
};

export function build_fixture_kickoff_date_time(
  fixture: ScheduledFixture,
): string {
  if (fixture.scheduled_date.includes(DATE_TIME_SEPARATOR)) {
    return fixture.scheduled_date;
  }
  const scheduled_time = fixture.scheduled_time.trim() || START_OF_DAY_TIME;
  return `${fixture.scheduled_date}${DATE_TIME_SEPARATOR}${scheduled_time}`;
}
