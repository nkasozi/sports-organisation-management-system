const SignedInObservation = {
  UNOBSERVED: "unobserved",
  SIGNED_IN: "signed_in",
  SIGNED_OUT: "signed_out",
} as const;

type SignedInObservationValue =
  (typeof SignedInObservation)[keyof typeof SignedInObservation];

interface SignedInResumeDependencies {
  is_engine_running(): boolean;
  request_push(): boolean;
}

function observe(signed_in: boolean): SignedInObservationValue {
  return signed_in
    ? SignedInObservation.SIGNED_IN
    : SignedInObservation.SIGNED_OUT;
}

export function create_signed_in_resume_watcher(
  dependencies: SignedInResumeDependencies,
): (signed_in: boolean) => boolean {
  let previous: SignedInObservationValue = SignedInObservation.UNOBSERVED;
  return (signed_in: boolean): boolean => {
    const became_signed_in =
      previous === SignedInObservation.SIGNED_OUT && signed_in;
    previous = observe(signed_in);
    if (!became_signed_in || !dependencies.is_engine_running()) return false;
    console.log("[BackgroundSync] Signed in again; pushing offline changes", {
      event: "background_sync_signed_in_resume_requested",
    });
    return dependencies.request_push();
  };
}
