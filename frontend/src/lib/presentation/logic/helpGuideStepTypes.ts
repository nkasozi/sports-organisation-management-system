export interface HelpGuideStep {
  step_number: number;
  title: string;
  description: string;
  link: string;
  details: string[];
}

export function create_help_guide_step(
  step_number: number,
  title: string,
  description: string,
  link: string,
  details: string[],
): HelpGuideStep {
  return { step_number, title, description, link, details };
}
