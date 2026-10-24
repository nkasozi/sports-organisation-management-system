import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  CONTACT_MESSAGE_FORM_MESSAGES,
  CONTACT_MESSAGE_SUBMISSION_STATUS,
  type ContactMessageFieldErrors,
  type ContactMessageFormValues,
  type ContactMessageSubmissionState,
} from "./contactMessageFormTypes";

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILTO_SCHEME = "mailto:";
const CONTACT_FORM_LOG_MESSAGES = {
  RECIPIENT_MISSING: "[ContactMessageForm] No organization contact email",
  EMAIL_APP_OPEN_FAILED: "[ContactMessageForm] Email app could not be opened",
  EMAIL_APP_OPENED: "[ContactMessageForm] Email app opened",
} as const;
const CONTACT_FORM_LOG_EVENTS = {
  RECIPIENT_MISSING: "contact_message_recipient_missing",
  EMAIL_APP_OPEN_FAILED: "contact_message_email_app_open_failed",
  EMAIL_APP_OPENED: "contact_message_email_app_opened",
} as const;

export function create_empty_contact_message_form_values(): ContactMessageFormValues {
  return { name: "", email: "", subject: "", message: "" };
}

export function create_empty_contact_message_field_errors(): ContactMessageFieldErrors {
  return { name: "", email: "", message: "" };
}

export function create_idle_contact_message_submission_state(): ContactMessageSubmissionState {
  return { status: CONTACT_MESSAGE_SUBMISSION_STATUS.IDLE };
}

function trim_contact_message_form_values(
  values: ContactMessageFormValues,
): ContactMessageFormValues {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    subject: values.subject.trim(),
    message: values.message.trim(),
  };
}

function resolve_email_field_error(email: string): string {
  if (!email) return CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_REQUIRED;
  return EMAIL_ADDRESS_PATTERN.test(email)
    ? ""
    : CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_INVALID;
}

function has_contact_message_field_errors(
  field_errors: ContactMessageFieldErrors,
): boolean {
  return Object.values(field_errors).some(
    (field_error: string) => field_error.length > 0,
  );
}

export function validate_contact_message_form(
  values: ContactMessageFormValues,
): Result<ContactMessageFormValues, ContactMessageFieldErrors> {
  const trimmed_values = trim_contact_message_form_values(values);
  const field_errors: ContactMessageFieldErrors = {
    name: trimmed_values.name
      ? ""
      : CONTACT_MESSAGE_FORM_MESSAGES.NAME_REQUIRED,
    email: resolve_email_field_error(trimmed_values.email),
    message: trimmed_values.message
      ? ""
      : CONTACT_MESSAGE_FORM_MESSAGES.MESSAGE_REQUIRED,
  };
  return has_contact_message_field_errors(field_errors)
    ? create_failure_result(field_errors)
    : create_success_result(trimmed_values);
}

function build_contact_message_body(values: ContactMessageFormValues): string {
  return `Name: ${values.name}\nEmail: ${values.email}\n\nMessage:\n${values.message}`;
}

export function build_contact_message_mailto_link(command: {
  recipient_email: string;
  values: ContactMessageFormValues;
}): Result<string> {
  const recipient_email = command.recipient_email.trim();
  if (!recipient_email) {
    console.warn(CONTACT_FORM_LOG_MESSAGES.RECIPIENT_MISSING, {
      event: CONTACT_FORM_LOG_EVENTS.RECIPIENT_MISSING,
    });
    return create_failure_result(
      CONTACT_MESSAGE_FORM_MESSAGES.RECIPIENT_MISSING,
    );
  }
  const subject =
    command.values.subject || CONTACT_MESSAGE_FORM_MESSAGES.DEFAULT_SUBJECT;
  const encoded_subject = encodeURIComponent(subject);
  const encoded_body = encodeURIComponent(
    build_contact_message_body(command.values),
  );
  return create_success_result(
    `${MAILTO_SCHEME}${recipient_email}?subject=${encoded_subject}&body=${encoded_body}`,
  );
}

function open_contact_message_mail_link(
  mailto_link: string,
  open_mail_link: (mailto_link: string) => boolean,
): ContactMessageSubmissionState {
  if (!open_mail_link(mailto_link)) {
    console.error(CONTACT_FORM_LOG_MESSAGES.EMAIL_APP_OPEN_FAILED, {
      event: CONTACT_FORM_LOG_EVENTS.EMAIL_APP_OPEN_FAILED,
    });
    return {
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED,
      message: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_APP_UNAVAILABLE,
    };
  }
  console.log(CONTACT_FORM_LOG_MESSAGES.EMAIL_APP_OPENED, {
    event: CONTACT_FORM_LOG_EVENTS.EMAIL_APP_OPENED,
  });
  return {
    status: CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED,
    message: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_APP_OPENED,
  };
}

export function submit_contact_message_form(command: {
  values: ContactMessageFormValues;
  recipient_email: string;
  open_mail_link: (mailto_link: string) => boolean;
}): ContactMessageSubmissionState {
  const validation_result = validate_contact_message_form(command.values);
  if (!validation_result.success) {
    return {
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.INVALID,
      field_errors: validation_result.error,
    };
  }
  const link_result = build_contact_message_mailto_link({
    recipient_email: command.recipient_email,
    values: validation_result.data,
  });
  if (!link_result.success) {
    return {
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED,
      message: link_result.error,
    };
  }
  return open_contact_message_mail_link(
    link_result.data,
    command.open_mail_link,
  );
}

export function resolve_contact_message_field_errors(
  state: ContactMessageSubmissionState,
): ContactMessageFieldErrors {
  switch (state.status) {
    case CONTACT_MESSAGE_SUBMISSION_STATUS.INVALID:
      return state.field_errors;
    case CONTACT_MESSAGE_SUBMISSION_STATUS.IDLE:
    case CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED:
    case CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED:
      return create_empty_contact_message_field_errors();
  }
}
