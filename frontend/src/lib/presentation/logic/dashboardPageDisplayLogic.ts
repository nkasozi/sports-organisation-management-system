interface OrganizationNameParts {
  prefix: string;
  suffix: string;
  remainder: string;
}

const TODAY_LABEL = "Today";
const TOMORROW_LABEL = "Tomorrow";
const TIME_PLACEHOLDER = "TBD";
const ACTIVE_STATUS_CLASS = "status-active";
const WARNING_STATUS_CLASS = "status-warning";
const INACTIVE_STATUS_CLASS = "status-inactive";

export function get_competition_initials(name: string): string {
  return name
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function split_organization_name(name: string): OrganizationNameParts {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { prefix: "", suffix: parts[0], remainder: "" };
  }
  return {
    prefix: parts[0],
    suffix: parts[1],
    remainder: parts.slice(2).join(" "),
  };
}

export function get_status_class(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
      return ACTIVE_STATUS_CLASS;
    case "upcoming":
    case "scheduled":
      return WARNING_STATUS_CLASS;
    case "completed":
    case "finished":
      return INACTIVE_STATUS_CLASS;
    default:
      return INACTIVE_STATUS_CLASS;
  }
}

export function format_fixture_date(
  scheduled_date: string,
  scheduled_time: string,
): string {
  const fixture_date = new Date(scheduled_date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const is_today = fixture_date.toDateString() === today.toDateString();
  const is_tomorrow = fixture_date.toDateString() === tomorrow.toDateString();
  const formatted_time = scheduled_time || TIME_PLACEHOLDER;

  if (is_today) return `${TODAY_LABEL}, ${formatted_time}`;
  if (is_tomorrow) return `${TOMORROW_LABEL}, ${formatted_time}`;

  const date_label = fixture_date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date_label}, ${formatted_time}`;
}
