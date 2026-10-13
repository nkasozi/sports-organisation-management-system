const InFlightWorkStatus = {
  ACCEPTING: "accepting",
  PAUSED: "paused",
} as const;

type InFlightWorkStatusValue =
  (typeof InFlightWorkStatus)[keyof typeof InFlightWorkStatus];

interface SyncInFlightWork {
  run_tracked<TResult>(work: () => Promise<TResult>): Promise<TResult>;
  run_if_accepting<TResult>(
    work: () => Promise<TResult>,
    when_paused: () => TResult,
  ): Promise<TResult>;
  pause_and_wait_until_idle(): Promise<number>;
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

export function create_sync_in_flight_work(): SyncInFlightWork {
  const running = new Set<Promise<unknown>>();
  let status: InFlightWorkStatusValue = InFlightWorkStatus.ACCEPTING;
  const run_tracked = <TResult>(
    work: () => Promise<TResult>,
  ): Promise<TResult> => {
    const promise = work();
    const forget = (): boolean => running.delete(settled);
    const settled: Promise<boolean> = promise.then(forget, forget);
    running.add(settled);
    return promise;
  };
  return {
    run_tracked,
    run_if_accepting: async (work, when_paused) => {
      switch (status) {
        case InFlightWorkStatus.ACCEPTING:
          return run_tracked(work);
        case InFlightWorkStatus.PAUSED:
          return when_paused();
      }
    },
    pause_and_wait_until_idle: (): Promise<number> => {
      status = InFlightWorkStatus.PAUSED;
      return wait_for_all(running);
    },
    resume: (): boolean => {
      status = InFlightWorkStatus.ACCEPTING;
      return true;
    },
  };
}

export const sync_in_flight_work = create_sync_in_flight_work();
