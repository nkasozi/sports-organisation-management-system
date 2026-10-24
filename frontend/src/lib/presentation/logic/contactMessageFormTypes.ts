export interface ContactMessageFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageFieldErrors {
  name: string;
  email: string;
  message: string;
}

export const CONTACT_MESSAGE_SUBMISSION_STATUS = {
  IDLE: "idle",
  INVALID: "invalid",
  OPENED: "opened",
  FAILED: "failed",
} as const;

export type ContactMessageSubmissionState =
  | { status: typeof CONTACT_MESSAGE_SUBMISSION_STATUS.IDLE }
  | {
      status: typeof CONTACT_MESSAGE_SUBMISSION_STATUS.INVALID;
      field_errors: ContactMessageFieldErrors;
    }
  | {
      status: typeof CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED;
      message: string;
    }
  | {
      status: typeof CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED;
      message: string;
    };

export const CONTACT_MESSAGE_FORM_MESSAGES = {
  NAME_REQUIRED: "Please tell us your name.",
  EMAIL_REQUIRED: "Please enter your email address so we can reply.",
  EMAIL_INVALID: "Please enter a valid email address, like name@example.com.",
  MESSAGE_REQUIRED: "Please write a message before sending.",
  DEFAULT_SUBJECT: "Message from the website",
  RECIPIENT_MISSING:
    "We could not find a contact email right now. Please try again later.",
  EMAIL_APP_OPENED:
    "Your email app should open with your message ready to send.",
  EMAIL_APP_UNAVAILABLE:
    "We could not open your email app. Please email us using the address shown on this page.",
} as const;
