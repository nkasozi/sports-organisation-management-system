type DynamicRoutes = {
	"/competitions/[id]": { id: string };
	"/competitions/[id]/constraints": { id: string };
	"/games/[id]": { id: string };
	"/games/[id]/manage": { id: string };
	"/officials/[id]": { id: string };
	"/organizations/[id]": { id: string };
	"/players/[id]": { id: string };
	"/sports/[id]": { id: string };
	"/teams/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/competitions": { id?: string };
	"/competitions/create": undefined;
	"/competitions/[id]": { id: string };
	"/competitions/[id]/constraints": { id: string };
	"/crud-test": undefined;
	"/games": { id?: string };
	"/games/create": undefined;
	"/games/[id]": { id: string };
	"/games/[id]/manage": { id: string };
	"/help": undefined;
	"/officials": { id?: string };
	"/officials/create": undefined;
	"/officials/[id]": { id: string };
	"/organizations": { id?: string };
	"/organizations/create": undefined;
	"/organizations/[id]": { id: string };
	"/players": { id?: string };
	"/players/create": undefined;
	"/players/[id]": { id: string };
	"/settings": undefined;
	"/sports": { id?: string };
	"/sports/create": undefined;
	"/sports/[id]": { id: string };
	"/teams": { id?: string };
	"/teams/create": undefined;
	"/teams/[id]": { id: string };
	"/workflow-test": undefined;
	"/workflow": undefined
};

export type RouteId = "/" | "/competitions" | "/competitions/create" | "/competitions/[id]" | "/competitions/[id]/constraints" | "/crud-test" | "/games" | "/games/create" | "/games/[id]" | "/games/[id]/manage" | "/help" | "/officials" | "/officials/create" | "/officials/[id]" | "/organizations" | "/organizations/create" | "/organizations/[id]" | "/players" | "/players/create" | "/players/[id]" | "/settings" | "/sports" | "/sports/create" | "/sports/[id]" | "/teams" | "/teams/create" | "/teams/[id]" | "/workflow-test" | "/workflow";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/competitions" | "/competitions/create" | `/competitions/${string}` & {} | `/competitions/${string}/constraints` & {} | "/crud-test" | "/games" | "/games/create" | `/games/${string}` & {} | `/games/${string}/manage` & {} | "/help" | "/officials" | "/officials/create" | `/officials/${string}` & {} | "/organizations" | "/organizations/create" | `/organizations/${string}` & {} | "/players" | "/players/create" | `/players/${string}` & {} | "/settings" | "/sports" | "/sports/create" | `/sports/${string}` & {} | "/teams" | "/teams/create" | `/teams/${string}` & {} | "/workflow-test" | "/workflow";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg" | "/icon-192.png" | "/manifest.json" | "/sw.js";