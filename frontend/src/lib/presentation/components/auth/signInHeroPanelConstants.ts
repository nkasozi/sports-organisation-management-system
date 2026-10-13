import type { SignInFeatureHighlight } from "$lib/presentation/logic/signInPageState";

export const SIGN_IN_FEATURE_ICON = {
  TROPHY: "trophy",
  USERS: "users",
  CLOCK: "clock",
  SHIELD: "shield",
} as const satisfies Record<string, SignInFeatureHighlight["icon"]>;
