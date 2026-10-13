import type {
  get_current_wizard_step,
  WizardStep,
} from "$lib/presentation/logic/uiWizardStepper";

type WizardStepPresenceStatus = ReturnType<
  typeof get_current_wizard_step
>["status"];

export const WIZARD_STEP_PRESENCE = {
  PRESENT: "present",
  MISSING: "missing",
} as const satisfies Record<string, WizardStepPresenceStatus>;

export interface UiWizardStepperEvents {
  step_changed: {
    previous_index: number;
    new_index: number;
    step: WizardStep;
  };
  step_completed: { step_index: number; step: WizardStep };
  validation_failed: { step_index: number; target_index: number };
  wizard_cancelled: void;
  wizard_completed: { completed_steps: WizardStep[] };
}
