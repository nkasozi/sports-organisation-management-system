export enum FILTER_RULE_ACTIVATION {
  WHEN_TRUTHY = "when_truthy",
  WHEN_KEY_PRESENT = "when_key_present",
}

export interface EntityFilterRule<TEntity, TFilter> {
  filter_key: keyof TFilter;
  activation: FILTER_RULE_ACTIVATION;
  matches: (entity: TEntity, filter: TFilter) => boolean;
}

export function predicate_rule<TEntity, TFilter>(
  filter_key: keyof TFilter,
  matches: (entity: TEntity, filter: TFilter) => boolean,
  activation: FILTER_RULE_ACTIVATION = FILTER_RULE_ACTIVATION.WHEN_TRUTHY,
): EntityFilterRule<TEntity, TFilter> {
  return { filter_key, activation, matches };
}

export function equals_rule<TEntity, TFilter>(
  key: keyof TFilter & keyof TEntity,
  activation: FILTER_RULE_ACTIVATION = FILTER_RULE_ACTIVATION.WHEN_TRUTHY,
): EntityFilterRule<TEntity, TFilter> {
  return predicate_rule<TEntity, TFilter>(
    key,
    (entity, filter) => (entity[key] as unknown) === (filter[key] as unknown),
    activation,
  );
}

export function text_contains_rule<TEntity, TFilter>(
  filter_key: keyof TFilter,
  read_text: (entity: TEntity) => string,
): EntityFilterRule<TEntity, TFilter> {
  return predicate_rule<TEntity, TFilter>(filter_key, (entity, filter) =>
    read_text(entity)
      .toLowerCase()
      .includes(String(filter[filter_key]).toLowerCase()),
  );
}

function is_rule_active<TEntity, TFilter>(
  rule: EntityFilterRule<TEntity, TFilter>,
  filter: TFilter,
): boolean {
  switch (rule.activation) {
    case FILTER_RULE_ACTIVATION.WHEN_TRUTHY:
      return Boolean(filter[rule.filter_key]);
    case FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT:
      return (rule.filter_key as PropertyKey) in (filter as object);
  }
}

export function apply_entity_filter_rules<TEntity, TFilter>(
  entities: TEntity[],
  filter: TFilter,
  rules: ReadonlyArray<EntityFilterRule<TEntity, TFilter>>,
): TEntity[] {
  return rules.reduce(
    (filtered_entities, rule) =>
      is_rule_active(rule, filter)
        ? filtered_entities.filter((entity) => rule.matches(entity, filter))
        : filtered_entities,
    entities,
  );
}
