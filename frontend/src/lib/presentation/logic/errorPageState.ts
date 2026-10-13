export interface ErrorConfig {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  primary_action_label: string;
  primary_action_href: string;
  secondary_action_label: string;
  show_error_code: boolean;
  accent_color: string;
}

const NOT_FOUND_STATUS = 404;
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;

const NOT_FOUND_ERROR_CONFIG: ErrorConfig = {
  icon: "search",
  title: "Page Not Found",
  subtitle: "We looked everywhere",
  description:
    "The page you're looking for doesn't exist or may have been moved. Check the URL or navigate back to a safe place.",
  primary_action_label: "Go Home",
  primary_action_href: "/",
  secondary_action_label: "Go Back",
  show_error_code: true,
  accent_color: "blue",
};

const UNAUTHORIZED_ERROR_CONFIG: ErrorConfig = {
  icon: "lock",
  title: "Authentication Required",
  subtitle: "Sign in to continue",
  description: "You need to be signed in to access this page.",
  primary_action_label: "Sign In",
  primary_action_href: "/sign-in",
  secondary_action_label: "Go Home",
  show_error_code: false,
  accent_color: "blue",
};

const FORBIDDEN_ERROR_CONFIG: ErrorConfig = {
  icon: "shield",
  title: "Access Denied",
  subtitle: "Permission required",
  description:
    "You don't have permission to view this page. Contact your administrator if you believe this is an error.",
  primary_action_label: "Go Home",
  primary_action_href: "/",
  secondary_action_label: "Contact Support",
  show_error_code: false,
  accent_color: "red",
};

const SERVER_ERROR_CONFIG: ErrorConfig = {
  icon: "alert",
  title: "Something Went Wrong",
  subtitle: "Server error",
  description:
    "We're experiencing technical difficulties. Please try again in a moment. If the problem persists, contact support.",
  primary_action_label: "Try Again",
  primary_action_href: "",
  secondary_action_label: "Go Home",
  show_error_code: true,
  accent_color: "red",
};

export function get_error_config(status: number): ErrorConfig {
  switch (status) {
    case NOT_FOUND_STATUS:
      return { ...NOT_FOUND_ERROR_CONFIG };
    case UNAUTHORIZED_STATUS:
      return { ...UNAUTHORIZED_ERROR_CONFIG };
    case FORBIDDEN_STATUS:
      return { ...FORBIDDEN_ERROR_CONFIG };
    default:
      return { ...SERVER_ERROR_CONFIG };
  }
}
