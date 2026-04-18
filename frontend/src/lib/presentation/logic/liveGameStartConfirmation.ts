const ISO_DATE_SEGMENT_LENGTH = 10;

function build_local_iso_date(current_date: Date): string {
  const year = current_date.getFullYear();
  const month = String(current_date.getMonth() + 1).padStart(2, "0");
  const day = String(current_date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function is_fixture_scheduled_for_different_date(
  scheduled_date: string,
  current_date: Date,
): boolean {
  if (typeof scheduled_date !== "string" || scheduled_date.trim() === "") {
    return false;
  }

  const normalized_scheduled_date = scheduled_date
    .trim()
    .slice(0, ISO_DATE_SEGMENT_LENGTH);
  const normalized_current_date = build_local_iso_date(current_date);
  return normalized_scheduled_date !== normalized_current_date;
}

export function format_fixture_scheduled_date_label(
  scheduled_date: string,
): string {
  const parsed_date = new Date(scheduled_date);
  if (Number.isNaN(parsed_date.getTime())) {
    return scheduled_date;
  }

  return parsed_date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
