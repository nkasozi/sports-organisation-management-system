export const TIMED_OPERATION_STATUS = {
  COMPLETED: "completed",
  TIMED_OUT: "timed_out",
  FAILED: "failed",
} as const;

export type TimedOperationOutcome<TValue> =
  | { status: typeof TIMED_OPERATION_STATUS.COMPLETED; value: TValue }
  | { status: typeof TIMED_OPERATION_STATUS.TIMED_OUT }
  | { status: typeof TIMED_OPERATION_STATUS.FAILED; error: string };

export const SESSION_OPERATION_TIMEOUT_MS = {
  PROFILE_LOOKUP: 15_000,
  SCOPED_RECORD_PULL: 15_000,
  ACCOUNT_PULL: 120_000,
  ACCESS_CHECK: 10_000,
  LOGOUT_SYNC: 20_000,
} as const;

function wait_for_timeout<TValue>(
  timeout_ms: number,
): Promise<TimedOperationOutcome<TValue>> {
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ status: TIMED_OPERATION_STATUS.TIMED_OUT }),
      timeout_ms,
    ),
  );
}

async function settle_operation<TValue>(
  operation: Promise<TValue>,
): Promise<TimedOperationOutcome<TValue>> {
  try {
    return { status: TIMED_OPERATION_STATUS.COMPLETED, value: await operation };
  } catch (error) {
    return { status: TIMED_OPERATION_STATUS.FAILED, error: String(error) };
  }
}

export function run_with_timeout<TValue>(
  operation: Promise<TValue>,
  timeout_ms: number,
): Promise<TimedOperationOutcome<TValue>> {
  return Promise.race([
    settle_operation(operation),
    wait_for_timeout<TValue>(timeout_ms),
  ]);
}
