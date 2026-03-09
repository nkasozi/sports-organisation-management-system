import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { AUDIT_LOG_RETENTION_DAYS } from "./audit_logs";

const crons = cronJobs();

crons.daily(
  "cleanup-old-audit-logs",
  { hourUTC: 3, minuteUTC: 0 },
  internal.audit_logs.delete_old_audit_logs_batch,
  { retention_days: AUDIT_LOG_RETENTION_DAYS },
);

export default crons;
