const REASON_LABEL = "Reason:";

export function with_failure_reason(message: string, reason: string): string {
  const trimmed_reason = reason.trim();
  return trimmed_reason
    ? `${message} ${REASON_LABEL} ${trimmed_reason}`
    : message;
}
