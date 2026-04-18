import type {
  EntityId,
  IsoDateString,
  Name,
  ScalarInput,
  ScalarValueInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type QualificationHolderType = "official" | "team_staff";

export type CertificationLevel =
  | "trainee"
  | "local"
  | "regional"
  | "national"
  | "international"
  | "fifa"
  | "other";

export interface Qualification extends BaseEntity {
  holder_type: QualificationHolderType;
  holder_id: EntityId;
  certification_name: Name;
  certification_level: CertificationLevel;
  certification_number: string;
  issuing_authority: string;
  issue_date: IsoDateString;
  expiry_date: IsoDateString;
  specializations: string[];
  notes: string;
  status: EntityStatus;
}

export type CreateQualificationInput = Omit<
  ScalarInput<Qualification>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateQualificationInput = Partial<CreateQualificationInput>;

type QualificationExpiryDayCount =
  | { status: "missing" }
  | { status: "present"; day_count: number };

const CERTIFICATION_LEVEL_OPTIONS = [
  { value: "trainee", label: "Trainee" },
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
  { value: "fifa", label: "FIFA" },
  { value: "other", label: "Other" },
];

const HOLDER_TYPE_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "team_staff", label: "Team Staff" },
];

export function create_empty_qualification_input(
  holder_type: QualificationHolderType,
  holder_id: CreateQualificationInput["holder_id"],
): CreateQualificationInput {
  const one_year_from_now = new Date();
  one_year_from_now.setFullYear(one_year_from_now.getFullYear() + 1);

  return {
    holder_type,
    holder_id,
    certification_name: "",
    certification_level: "local",
    certification_number: "",
    issuing_authority: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: one_year_from_now.toISOString().split("T")[0],
    specializations: [],
    notes: "",
    status: "active",
  };
}

export function validate_qualification_input(
  input: CreateQualificationInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.holder_type) {
    validation_errors.push("Holder type is required");
  }

  if (!input.holder_id) {
    validation_errors.push("Holder ID is required");
  }

  if (!input.certification_name || input.certification_name.trim().length < 1) {
    validation_errors.push("Certification name is required");
  }

  if (!input.certification_level) {
    validation_errors.push("Certification level is required");
  }

  if (input.issue_date && input.expiry_date) {
    const issue = new Date(input.issue_date);
    const expiry = new Date(input.expiry_date);
    if (expiry <= issue) {
      validation_errors.push("Expiry date must be after issue date");
    }
  }

  return validation_errors;
}

export function is_qualification_expired(
  expiry_date: ScalarValueInput<Qualification["expiry_date"]>,
): boolean {
  if (!expiry_date) {
    return false;
  }
  const expiry = new Date(expiry_date);
  return expiry < new Date();
}

export function get_days_until_expiry(
  expiry_date: ScalarValueInput<Qualification["expiry_date"]>,
): QualificationExpiryDayCount {
  if (!expiry_date) {
    return { status: "missing" };
  }
  const expiry = new Date(expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diff_time = expiry.getTime() - today.getTime();
  const diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));
  return { status: "present", day_count: diff_days };
}

function get_qualification_display_name(qualification: Qualification): string {
  return `${qualification.certification_name} (${qualification.certification_level})`;
}

function get_expiry_status_color(
  expiry_date: Qualification["expiry_date"],
): string {
  const expiry_day_count = get_days_until_expiry(expiry_date);

  if (expiry_day_count.status !== "present") return "gray";
  if (expiry_day_count.day_count < 0) return "red";
  if (expiry_day_count.day_count <= 30) return "blue";
  if (expiry_day_count.day_count <= 90) return "yellow";
  return "green";
}
