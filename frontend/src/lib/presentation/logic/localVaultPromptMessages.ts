export const LOCAL_VAULT_PIN_MINIMUM_LENGTH = 6;

export const LOCAL_VAULT_PROMPT_MESSAGE = {
  PASSKEY_UNLOCK_FAILED:
    "We could not confirm your fingerprint. Please try again.",
  PIN_UNLOCK_FAILED: "That PIN did not unlock your data. Please try again.",
  PIN_REQUIRED: "Please enter your PIN.",
  PIN_TOO_SHORT: `Your PIN must be at least ${LOCAL_VAULT_PIN_MINIMUM_LENGTH} characters long.`,
  PIN_MISMATCH: "The two PINs do not match. Please type them again.",
  PASSKEY_SETUP_FAILED:
    "Fingerprint unlock was not set up. Please try again when you are ready.",
  PIN_SETUP_FAILED: "Your PIN could not be saved. Please try again.",
  START_OVER_FAILED:
    "This device could not be cleared. Please reload the page and try again.",
  LOCAL_DATA_UNAVAILABLE:
    "Sport-Sync could not open the data stored on this device. Please reload the page to try again.",
  STORAGE_UNREADABLE:
    "We couldn't open this device's secure storage. Try again.",
  SIGN_OUT_INSTEAD: "Sign-in was cancelled before your data was protected.",
  PROTECTION_NOT_SAVED: "Your data could not be protected on this device.",
} as const;

export const LOCAL_VAULT_DEFAULT_OWNER_LABEL = "Sport-Sync user";
