import { describe, expect, it, vi } from "vitest";

import {
  build_contact_message_mailto_link,
  create_empty_contact_message_field_errors,
  create_empty_contact_message_form_values,
  create_idle_contact_message_submission_state,
  resolve_contact_message_field_errors,
  submit_contact_message_form,
  validate_contact_message_form,
} from "./contactMessageForm";
import {
  CONTACT_MESSAGE_FORM_MESSAGES,
  CONTACT_MESSAGE_SUBMISSION_STATUS,
} from "./contactMessageFormTypes";

const VALID_VALUES = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Fixture question",
  message: "When is the next game?",
};

describe("contactMessageForm", () => {
  it("starts with empty values and no field errors", () => {
    expect(create_empty_contact_message_form_values()).toEqual({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    expect(create_empty_contact_message_field_errors()).toEqual({
      name: "",
      email: "",
      message: "",
    });
  });

  it("asks for every required field with friendly messages", () => {
    const result = validate_contact_message_form({
      name: "  ",
      email: "",
      subject: "",
      message: " ",
    });
    expect(result).toEqual({
      success: false,
      error: {
        name: CONTACT_MESSAGE_FORM_MESSAGES.NAME_REQUIRED,
        email: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_REQUIRED,
        message: CONTACT_MESSAGE_FORM_MESSAGES.MESSAGE_REQUIRED,
      },
    });
  });

  it("rejects an email address that does not look valid", () => {
    const result = validate_contact_message_form({
      ...VALID_VALUES,
      email: "ada-at-example",
    });
    expect(result).toEqual({
      success: false,
      error: {
        name: "",
        email: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_INVALID,
        message: "",
      },
    });
  });

  it("accepts complete values and trims them", () => {
    const result = validate_contact_message_form({
      ...VALID_VALUES,
      name: "  Ada Lovelace ",
    });
    expect(result).toEqual({ success: true, data: VALID_VALUES });
  });

  it("builds an encoded mailto link with the subject and a body containing name, email and message", () => {
    const result = build_contact_message_mailto_link({
      recipient_email: "info@club.test",
      values: { ...VALID_VALUES, message: "Line one & two?" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const link = result.data;
    expect(link.startsWith("mailto:info@club.test?subject=")).toBe(true);
    const query = new URLSearchParams(link.split("?")[1]);
    expect(query.get("subject")).toBe("Fixture question");
    expect(query.get("body")).toBe(
      "Name: Ada Lovelace\nEmail: ada@example.com\n\nMessage:\nLine one & two?",
    );
    expect(link).not.toContain(" ");
  });

  it("uses a friendly default subject when none is given", () => {
    const result = build_contact_message_mailto_link({
      recipient_email: "info@club.test",
      values: { ...VALID_VALUES, subject: "" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const query = new URLSearchParams(result.data.split("?")[1]);
    expect(query.get("subject")).toBe(
      CONTACT_MESSAGE_FORM_MESSAGES.DEFAULT_SUBJECT,
    );
  });

  it("fails when there is no organization contact email", () => {
    expect(
      build_contact_message_mailto_link({
        recipient_email: " ",
        values: VALID_VALUES,
      }),
    ).toEqual({
      success: false,
      error: CONTACT_MESSAGE_FORM_MESSAGES.RECIPIENT_MISSING,
    });
  });

  it("returns field errors and does not open the email app when the form is invalid", () => {
    const open_mail_link = vi.fn(() => true);
    const state = submit_contact_message_form({
      values: { ...VALID_VALUES, name: "" },
      recipient_email: "info@club.test",
      open_mail_link,
    });
    expect(state.status).toBe(CONTACT_MESSAGE_SUBMISSION_STATUS.INVALID);
    expect(open_mail_link).not.toHaveBeenCalled();
  });

  it("opens the email app and confirms when the form is valid", () => {
    const open_mail_link = vi.fn(() => true);
    const state = submit_contact_message_form({
      values: VALID_VALUES,
      recipient_email: "info@club.test",
      open_mail_link,
    });
    expect(open_mail_link).toHaveBeenCalledTimes(1);
    expect(state).toEqual({
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED,
      message: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_APP_OPENED,
    });
  });

  it("reports a friendly failure when the email link cannot be built or opened", () => {
    const missing_recipient_state = submit_contact_message_form({
      values: VALID_VALUES,
      recipient_email: "",
      open_mail_link: vi.fn(() => true),
    });
    expect(missing_recipient_state).toEqual({
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED,
      message: CONTACT_MESSAGE_FORM_MESSAGES.RECIPIENT_MISSING,
    });
    const open_failed_state = submit_contact_message_form({
      values: VALID_VALUES,
      recipient_email: "info@club.test",
      open_mail_link: vi.fn(() => false),
    });
    expect(open_failed_state).toEqual({
      status: CONTACT_MESSAGE_SUBMISSION_STATUS.FAILED,
      message: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_APP_UNAVAILABLE,
    });
  });

  it("exposes field errors only for an invalid submission", () => {
    const field_errors = {
      name: CONTACT_MESSAGE_FORM_MESSAGES.NAME_REQUIRED,
      email: "",
      message: "",
    };
    expect(
      resolve_contact_message_field_errors({
        status: CONTACT_MESSAGE_SUBMISSION_STATUS.INVALID,
        field_errors,
      }),
    ).toEqual(field_errors);
    expect(
      resolve_contact_message_field_errors(
        create_idle_contact_message_submission_state(),
      ),
    ).toEqual(create_empty_contact_message_field_errors());
    expect(
      resolve_contact_message_field_errors({
        status: CONTACT_MESSAGE_SUBMISSION_STATUS.OPENED,
        message: CONTACT_MESSAGE_FORM_MESSAGES.EMAIL_APP_OPENED,
      }),
    ).toEqual(create_empty_contact_message_field_errors());
  });
});
