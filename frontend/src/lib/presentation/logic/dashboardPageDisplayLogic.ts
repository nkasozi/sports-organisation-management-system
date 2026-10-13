import {
  DASHBOARD_STATUS_CLASS_BY_STATUS,
  DashboardDisplayLabel,
  DashboardStatusClass,
} from "./dashboardPageConstants";

interface OrganizationNameParts {
  prefix: string;
  suffix: string;
  remainder: string;
}

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

export function get_status_class(status: string): DashboardStatusClass {
  return (
    DASHBOARD_STATUS_CLASS_BY_STATUS[status] ?? DashboardStatusClass.INACTIVE
  );
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
  const formatted_time =
    scheduled_time || DashboardDisplayLabel.TIME_PLACEHOLDER;

  if (is_today) return `${DashboardDisplayLabel.TODAY}, ${formatted_time}`;
  if (is_tomorrow)
    return `${DashboardDisplayLabel.TOMORROW}, ${formatted_time}`;

  const date_label = fixture_date.toLocaleDateString(
    DashboardDisplayLabel.DATE_LOCALE,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    },
  );
  return `${date_label}, ${formatted_time}`;
}
