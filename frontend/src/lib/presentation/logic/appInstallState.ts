export const APP_INSTALL_STATE = {
  INSTALLED: "installed",
  PROMPT_READY: "prompt_ready",
  IOS_INSTRUCTIONS: "ios_instructions",
  UNAVAILABLE: "unavailable",
} as const;

export type AppInstallState =
  (typeof APP_INSTALL_STATE)[keyof typeof APP_INSTALL_STATE];

interface AppInstallFacts {
  is_standalone: boolean;
  has_install_prompt: boolean;
  is_ios_safari: boolean;
  was_installed: boolean;
}

const IOS_DEVICE_PATTERN = /iPhone|iPad|iPod/;
const MAC_DESKTOP_PATTERN = /Macintosh/;
const NON_SAFARI_IOS_BROWSER_PATTERN = /CriOS|FxiOS|EdgiOS|OPiOS/;
const SAFARI_PATTERN = /Safari/;
const MIN_IPAD_TOUCH_POINTS = 1;

export function is_ios_safari_user_agent(
  user_agent: string,
  max_touch_points: number,
): boolean {
  const is_ipad_as_mac =
    MAC_DESKTOP_PATTERN.test(user_agent) &&
    max_touch_points >= MIN_IPAD_TOUCH_POINTS;
  const is_ios_device = IOS_DEVICE_PATTERN.test(user_agent) || is_ipad_as_mac;
  return (
    is_ios_device &&
    SAFARI_PATTERN.test(user_agent) &&
    !NON_SAFARI_IOS_BROWSER_PATTERN.test(user_agent)
  );
}

export function resolve_app_install_state(
  facts: AppInstallFacts,
): AppInstallState {
  if (facts.is_standalone || facts.was_installed)
    return APP_INSTALL_STATE.INSTALLED;
  if (facts.has_install_prompt) return APP_INSTALL_STATE.PROMPT_READY;
  if (facts.is_ios_safari) return APP_INSTALL_STATE.IOS_INSTRUCTIONS;
  return APP_INSTALL_STATE.UNAVAILABLE;
}
