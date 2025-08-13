type DynamicRoutes = {
	"/organizations/[id]": { id: string }
};

type Layouts = {
	"/": { id?: string };
	"/organizations": { id?: string };
	"/organizations/create": undefined;
	"/organizations/[id]": { id: string }
};

export type RouteId = "/" | "/organizations" | "/organizations/create" | "/organizations/[id]";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/organizations" | "/organizations/create" | `/organizations/${string}` & {};

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/favicon.svg" | "/icon-192.png" | "/manifest.json" | "/sw.js";