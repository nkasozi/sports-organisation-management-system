const DATE_TIME_SEPARATOR = "T";

type ScheduledFixture = {
  scheduled_date: string;
  scheduled_time: string;
};

export function build_fixture_kickoff_date_time(
  fixture: ScheduledFixture,
): string {
  const date = fixture.scheduled_date.trim();
  if (!date) return "";
  if (fixture.scheduled_date.includes(DATE_TIME_SEPARATOR)) {
    return fixture.scheduled_date;
  }
  const scheduled_time = fixture.scheduled_time.trim();
  return scheduled_time
    ? `${date}${DATE_TIME_SEPARATOR}${scheduled_time}`
    : date;
}
