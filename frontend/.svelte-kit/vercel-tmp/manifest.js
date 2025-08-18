export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg","icon-192.png","manifest.json","sw.js"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".json":"application/json",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.DoYa48Ce.js",app:"_app/immutable/entry/app.DCcXa9Lk.js",imports:["_app/immutable/entry/start.DoYa48Ce.js","_app/immutable/chunks/Cplue3-F.js","_app/immutable/chunks/DhAImXhw.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CvESoDjb.js","_app/immutable/entry/app.DCcXa9Lk.js","_app/immutable/chunks/DhAImXhw.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DCA2aStm.js","_app/immutable/chunks/BJia4XKL.js","_app/immutable/chunks/BcHKa6QZ.js","_app/immutable/chunks/CvESoDjb.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/crud-test",
				pattern: /^\/crud-test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/organizations",
				pattern: /^\/organizations\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/organizations/create",
				pattern: /^\/organizations\/create\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/organizations/[id]",
				pattern: /^\/organizations\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/workflow",
				pattern: /^\/workflow\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
