interface AppVersionNavigationFacts {
  is_new_version_available: boolean;
  will_unload: boolean;
  has_target_url: boolean;
}

export function should_reload_for_new_version(
  facts: AppVersionNavigationFacts,
): boolean {
  return (
    facts.is_new_version_available && !facts.will_unload && facts.has_target_url
  );
}
