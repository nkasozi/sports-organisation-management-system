import { describe, expect, it } from "vitest";

import {
  APP_INSTALL_STATE,
  is_ios_safari_user_agent,
  resolve_app_install_state,
} from "./appInstallState";

const browser_tab = {
  is_standalone: false,
  has_install_prompt: false,
  is_ios_safari: false,
  was_installed: false,
};

describe("resolve_app_install_state", () => {
  it("offers the install button when the browser has an install prompt", () => {
    expect(
      resolve_app_install_state({ ...browser_tab, has_install_prompt: true }),
    ).toBe(APP_INSTALL_STATE.PROMPT_READY);
  });

  it("shows add-to-home-screen steps on iPhone and iPad Safari", () => {
    expect(
      resolve_app_install_state({ ...browser_tab, is_ios_safari: true }),
    ).toBe(APP_INSTALL_STATE.IOS_INSTRUCTIONS);
  });

  it("hides the button when the app already runs as an installed app", () => {
    expect(
      resolve_app_install_state({
        ...browser_tab,
        is_standalone: true,
        has_install_prompt: true,
        is_ios_safari: true,
      }),
    ).toBe(APP_INSTALL_STATE.INSTALLED);
  });

  it("hides the button once the app has just been installed", () => {
    expect(
      resolve_app_install_state({
        ...browser_tab,
        was_installed: true,
        has_install_prompt: true,
      }),
    ).toBe(APP_INSTALL_STATE.INSTALLED);
  });

  it("hides the button when the browser cannot install the app", () => {
    expect(resolve_app_install_state(browser_tab)).toBe(
      APP_INSTALL_STATE.UNAVAILABLE,
    );
  });
});

describe("is_ios_safari_user_agent", () => {
  it("recognises iPhone Safari but not Chrome on iPhone", () => {
    expect(
      is_ios_safari_user_agent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        5,
      ),
    ).toBe(true);
    expect(
      is_ios_safari_user_agent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1",
        5,
      ),
    ).toBe(false);
  });

  it("recognises iPad Safari that reports itself as a Mac", () => {
    const ipad_desktop_agent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
    expect(is_ios_safari_user_agent(ipad_desktop_agent, 5)).toBe(true);
    expect(is_ios_safari_user_agent(ipad_desktop_agent, 0)).toBe(false);
  });
});
