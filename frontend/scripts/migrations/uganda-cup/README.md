# Uganda Cup 2026 migration

Source: <https://challenge.place/c/6a15adab5afc4d1f05826e36> (men's competition).
Destination: the existing Uganda Cup under Uganda Hockey Association on
`animated-squirrel-109`, the backend used by `sport-org.vercel.app`.

The source archive contains the public spectator feed: all 11 rosters, 317
distinct player profiles, 13 accessible series, and 25 match slots. Twenty
matches have completed results; one final has teams and a date but no result.
Four slots have neither teams nor results and are retained only in the archive.
Disabled series remain in the source stage snapshot.

## Run from `frontend`

```sh
node scripts/migrations/uganda-cup/export-source.mjs
node scripts/migrations/uganda-cup/migrate.mjs
node scripts/migrations/uganda-cup/migrate.mjs --apply
```

Export is read-only and anonymous. It uses the same public Socket.IO spectator
rooms as the web client. It never edits Challenge Place or requests private
rooms. `source.json` is the captured source evidence; do not refresh it silently
when reproducing this particular import.

The migration defaults to a read-only plan. Applying it requires existing Convex
deployment administrator access and uses the application's guarded, audited sync
mutations as the existing super admin. It adds deterministic source IDs, checks
record versions for updates, preserves existing teams and stages, and never
deletes data. Destination reads use anonymous public queries with server-side
organization filtering. No unrelated private production tables are exported.

`plan.json` records pending writes. `verification.json` records the source SHA-256,
the match-by-match score audit, counts, and successful destination verification.
A completed repeat run has zero pending writes.

## Fidelity and unknown values

- Player identity follows source IDs. Jonathan KAYONDO, Cliff OWINO, and Lamech
  OMOKO each occur under two distinct source IDs; those entries stay separate.
- No dates of birth, nationalities, positions, jersey numbers, or membership
  start dates are provided. Unknown strings stay empty; jersey number uses the
  application's existing unknown value, zero. No personal details are invented.
- Scores, home/away orientation, dates, Kampala times, rounds, and both legs are
  copied from match details. Series-win counts are not used as goal scores.
- The second KHC Originals–Rockets semifinal has no source date. The user later
  confirmed Sunday 1 November 2026 at 15:30 Kampala time; `date-overrides.json`
  preserves that correction without modifying the captured source evidence.
- All 476 source events are retained, including 127 goals, 127 corresponding
  goals-conceded entries, 86 assists, 67 green cards, 38 yellow cards, one red
  card, 28 penalty corners, and two penalty strokes. Goals-conceded and assists
  do not add to the score. Related assists also populate the goal's secondary
  player field for the application's player statistics.
- Quarter IDs map to the Field Hockey preset. Exact quarter scores and source
  series information are retained in fixture notes. Original event IDs, order,
  relationships, and stats remain in `source.json`, keyed by the source event ID
  embedded in each imported event ID. Visible descriptions contain only the event
  label and, where available, the quarter (for example, `Goal · Quarter 1`).
- Source events omit exact minutes and recording times. The required numeric
  minute uses zero as a storage placeholder, displayed as `0′` without import
  metadata in the timeline; recording times stay empty. Zero is a fallback, not a
  verified first-minute event. No match lineup is inferred from a team roster.
- The importer checks each completed score against its source goal events and
  verifies all saved fixtures, complete event arrays, player names, source
  identities, and memberships against the plan.

This migration changes records through existing backend APIs; it does not deploy
application code or change authentication, permissions, or production schemas.

## Women's competition

The first archive covers men only. The women's spectator feed was subsequently
exported independently:

```sh
node scripts/migrations/uganda-cup/export-source.mjs 6a15aeea99a101a46e33f643 women-source.json
node scripts/migrations/uganda-cup/seed-women.mjs --apply
node scripts/migrations/uganda-cup/migrate.mjs --women --apply
```

`Uganda Cup Women` contains eight female teams, 200 distinct source player
profiles, 12 completed results, and one unplayed final. Original team logos are
copied during seeding. The source's `Kampala` women's team is named `Kampala Swans`
in Sport Org; its source ID and original name are retained in
`women-foundation.json`. Women's IDs have a separate deterministic prefix so
similarly named men's and women's teams or players are never merged.

The recorded Wananchi-HDF 3–2 Kampala Swans semifinal uses the user's confirmed
Sunday 1 November date and 14:00 Kampala kickoff. A recorded Thunders 0–5
Weatherhead result has no source events: its score is preserved and scorers are
not invented. Single-name players retain their source names with blank surnames.
`women-plan.json` and `women-verification.json` provide the separate import audit.

## Team logos

`node scripts/migrations/uganda-cup/import-logos.mjs` downloads and checks the 11
original public JPEG logos referenced by the archived team IDs, then prepares a
plan. Add `--apply` to save them to the existing teams using version-checked sync
mutations. Original image bytes are embedded in `logo_url`, so displaying a logo
does not depend on a hotlink to Challenge Place. `logo-verification.json` records
source URLs, byte counts, hashes, team mappings, and successful saved-image
verification. The importer also checks that unrelated team fields are unchanged.
