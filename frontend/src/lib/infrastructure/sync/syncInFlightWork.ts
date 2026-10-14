const InFlightWorkStatus = {
  ACCEPTING: "accepting",
  PAUSED: "paused",
  MAINTENANCE: "maintenance",
} as const;

type InFlightWorkStatusValue =
  (typeof InFlightWorkStatus)[keyof typeof InFlightWorkStatus];

interface SyncInFlightWork {
  run_tracked<TResult>(work: () => Promise<TResult>): Promise<TResult>;
  run_if_accepting<TResult>(
    work: () => Promise<TResult>,
    when_paused: () => TResult,
  ): Promise<TResult>;
  run_unless_maintenance<TResult>(
    work: () => Promise<TResult>,
    when_blocked: () => TResult,
  ): Promise<TResult>;
  pause_and_wait_until_idle(): Promise<number>;
  enter_maintenance_and_wait_until_idle(): Promise<number>;
  resume(): boolean;
}

async function wait_for_all(running: Set<Promise<unknown>>): Promise<number> {
  let settled_count = 0;
  while (running.size > 0) {
    const batch = [...running];
    await Promise.allSettled(batch);
    settled_count += batch.length;
  }
  return settled_count;
}

function create_tracker(
  running: Set<Promise<unknown>>,
): SyncInFlightWork["run_tracked"] {
  return <TResult>(work: () => Promise<TResult>): Promise<TResult> => {
    const promise = work();
    const forget = (): boolean => running.delete(settled);
    const settled: Promise<boolean> = promise.then(forget, forget);
    running.add(settled);
    return promise;
  };
}

export function create_sync_in_flight_work(): SyncInFlightWork {
  const running = new Set<Promise<unknown>>();
  let status: InFlightWorkStatusValue = InFlightWorkStatus.ACCEPTING;
  const run_tracked = create_tracker(running);
  const enter = (next: InFlightWorkStatusValue): Promise<number> => {
    status = next;
    return wait_for_all(running);
  };
  return {
    run_tracked,
    run_if_accepting: async (work, when_paused) =>
      status === InFlightWorkStatus.ACCEPTING
        ? run_tracked(work)
        : when_paused(),
    run_unless_maintenance: async (work, when_blocked) =>
      status === InFlightWorkStatus.MAINTENANCE
        ? when_blocked()
        : run_tracked(work),
    pause_and_wait_until_idle: () => enter(InFlightWorkStatus.PAUSED),
    enter_maintenance_and_wait_until_idle: () =>
      enter(InFlightWorkStatus.MAINTENANCE),
    resume: (): boolean => {
      status = InFlightWorkStatus.ACCEPTING;
      return true;
    },
  };
}

export const sync_in_flight_work = create_sync_in_flight_work();
