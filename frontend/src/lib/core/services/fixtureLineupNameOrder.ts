const NATURAL_NAME_COLLATOR = new Intl.Collator([], {
  numeric: true,
  sensitivity: "base",
});

export function compare_lineup_player_names(
  first_player: { first_name: string; last_name: string },
  second_player: { first_name: string; last_name: string },
): number {
  return NATURAL_NAME_COLLATOR.compare(
    `${first_player.last_name} ${first_player.first_name}`,
    `${second_player.last_name} ${second_player.first_name}`,
  );
}
