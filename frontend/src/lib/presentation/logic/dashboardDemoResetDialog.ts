export const DEMO_RESET_DIALOG = {
  CLOSED: "closed",
  OPEN: "open",
} as const;

export type DemoResetDialogState =
  (typeof DEMO_RESET_DIALOG)[keyof typeof DEMO_RESET_DIALOG];

export const DEMO_RESET_DIALOG_TEXT = {
  TITLE: "Reset demo data?",
  MESSAGE:
    "This deletes every organisation, competition, team, player and game, including synced server data when you are signed in, and reloads the demo data. It cannot be undone.",
  CONFIRM: "Reset Demo Data",
} as const;
