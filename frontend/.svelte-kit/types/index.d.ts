type DynamicRoutes = {
	"/organizations/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/competitions": undefined;
	"/crud-test": undefined;
	"/organizations": { id?: string };
	"/organizations/create": undefined;
	"/organizations/[id]": { id: string };
	"/workflow": undefined
};

export type RouteId = "/" | "/competitions" | "/crud-test" | "/organizations" | "/organizations/create" | "/organizations/[id]" | "/workflow";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/competitions" | "/crud-test" | "/organizations" | "/organizations/create" | `/organizations/${string}` & {} | "/workflow";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg" | "/icon-192.png" | "/manifest.json" | "/sw.js";