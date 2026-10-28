# End-to-end tests with real signed-in profiles

These tests sign in as real users of the Clerk **development** instance (using
[Clerk Agent Tasks](https://clerk.com/docs/guides/development/testing/agent-tasks))
and drive the real app against the **dev** Convex deployment. No role switching
in the browser — each role gets its own Clerk user and its own system user.

## What runs

1. `world.setup.ts` — the e2e super admin builds a small league through the UI
   (sport, organization, venue, two teams, officials, players, memberships,
   competition) if it isn't there yet, then registers one profile per role.
2. `role-access.e2e.ts` — every role sees exactly its own menu, is turned away
   from other areas, and only sees its own records on its "My …" pages.
3. `live-game.e2e.ts` — a full game day: scheduling, assigning a table official
   (required), a field official who can only watch, the table official starting
   and running the game with a limited number of event edits, the officials
   manager resetting them, the game ending, and observers (org admin, another
   official, the public) reading the corrections and their reasons — including
   the org admin finding the table official's corrections in the Audit Trail,
   which the server writes for every change it accepts.

Every step that saves data waits until the record is on the server, so a
change the server rejects fails the test instead of passing silently.

## Running

Start the dev server (or let Playwright start it), then from `frontend/`:

```bash
npm run test:e2e
```

Useful switches:

- `npm run test:e2e:world` — only (re)build the world.
- `E2E_KEEP_GAMES=1` — don't clear today's games first, so a single step of
  `live-game.e2e.ts` can be rerun with `-g`.
- `E2E_CONSOLE="pattern"` — print matching browser console lines.

To start from an empty league:

```bash
npx convex run e2e_profiles:reset_e2e_world '{"organization_name":"E2E Hockey League","sport_name":"E2E Field Hockey"}'
```

## Requirements and safety

- `.env.local` must hold the Clerk **development** secret key; the helpers
  refuse an `sk_live_` key.
- The dev Convex deployment needs `E2E_PROFILES_ENABLED=true`
  (`npx convex env set E2E_PROFILES_ENABLED true`). The `e2e_profiles`
  functions are internal (CLI only), refuse to do anything without that flag,
  and only accept `+clerk_test@example.com` addresses. Never set the flag on
  production.
- Test users are `e2e-<role>+clerk_test@example.com` in the Clerk dev instance.
