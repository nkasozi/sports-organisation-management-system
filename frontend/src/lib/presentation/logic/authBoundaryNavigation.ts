import { get_is_auth_page } from "./layoutLogic";

interface AuthBoundaryNavigationFacts {
  from_path: string;
  to_path: string;
  will_unload: boolean;
}

export function should_reload_across_auth_boundary(
  facts: AuthBoundaryNavigationFacts,
): boolean {
  if (facts.will_unload || facts.to_path.length === 0) return false;
  return get_is_auth_page(facts.from_path) !== get_is_auth_page(facts.to_path);
}
