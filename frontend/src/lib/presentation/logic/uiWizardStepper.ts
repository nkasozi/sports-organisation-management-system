export interface WizardStep {
  is_completed?: boolean;
  is_optional?: boolean;
  step_description?: string;
  step_title?: string;
  [key: string]: unknown;
}

export function get_current_wizard_step(
  step_list: WizardStep[],
  index: number,
): WizardStep | null {
  return index < 0 || index >= step_list.length ? null : step_list[index];
}

export function get_wizard_progress_percentage(
  current_index: number,
  total_steps: number,
): number {
  return total_steps === 0
    ? 0
    : Math.round(((current_index + 1) / total_steps) * 100);
}

export function can_navigate_previous_step(current_index: number): boolean {
  return current_index > 0;
}

export function can_navigate_next_step(
  current_index: number,
  step_list: WizardStep[],
  allow_skip_steps: boolean,
  has_custom_validation: boolean,
): boolean {
  if (current_index >= step_list.length - 1) return false;
  const current_step = step_list[current_index];
  if (!current_step) return false;
  if (has_custom_validation) return true;
  return Boolean(
    current_step.is_completed || (allow_skip_steps && current_step.is_optional),
  );
}

export function is_final_wizard_step(
  current_index: number,
  total_steps: number,
): boolean {
  return current_index === total_steps - 1;
}

export function are_all_required_wizard_steps_completed(
  step_list: WizardStep[],
): boolean {
  return step_list.every((step: WizardStep) =>
    Boolean(step.is_completed || step.is_optional),
  );
}

export function get_wizard_step_status_class(
  step: WizardStep | null,
  current_step_index: number,
  step_index: number,
): string {
  if (step_index === current_step_index)
    return "bg-secondary-600 text-white dark:bg-secondary-500";
  if (step?.is_completed)
    return "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100";
  return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
}

export function get_wizard_step_connector_class(
  step_list: WizardStep[],
  current_step_index: number,
  step_index: number,
): string {
  return step_index <= current_step_index || step_list[step_index]?.is_completed
    ? "bg-secondary-600 dark:bg-secondary-500"
    : "bg-gray-200 dark:bg-gray-600";
}
