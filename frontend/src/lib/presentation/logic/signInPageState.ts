interface SignInPageErrorState {
  error_param: string | null;
  has_server_error: boolean;
  has_sync_error: boolean;
}

export interface SignInFeatureHighlight {
  icon: "trophy" | "users" | "clock" | "shield";
  title: string;
  description: string;
}

export const sign_in_feature_highlights: SignInFeatureHighlight[] = [
  {
    icon: "trophy",
    title: "Competitions",
    description: "Manage leagues, tournaments and fixtures",
  },
  {
    icon: "users",
    title: "Teams & Players",
    description: "Rosters, transfers and player profiles",
  },
  {
    icon: "clock",
    title: "Live Games",
    description: "Real-time scoring and event tracking",
  },
  {
    icon: "shield",
    title: "Officials",
    description: "Assign and manage match officials",
  },
];

export function get_sign_in_page_error_state(
  current_url: URL,
): SignInPageErrorState {
  const error_param = current_url.searchParams.get("error");
  return {
    error_param,
    has_server_error: error_param === "server_unavailable",
    has_sync_error: Boolean(
      error_param && error_param !== "server_unavailable",
    ),
  };
}
