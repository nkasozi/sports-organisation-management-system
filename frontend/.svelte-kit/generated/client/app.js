export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/competitions": [3],
		"/competitions/create": [6],
		"/competitions/[id]": [4],
		"/competitions/[id]/constraints": [5],
		"/crud-test": [7],
		"/games": [8],
		"/games/create": [10],
		"/games/[id]/manage": [9],
		"/help": [11],
		"/officials": [12],
		"/officials/create": [14],
		"/officials/[id]": [13],
		"/organizations": [15],
		"/organizations/create": [17],
		"/organizations/[id]": [16],
		"/players": [18],
		"/players/create": [20],
		"/players/[id]": [19],
		"/settings": [21],
		"/sports": [22],
		"/sports/create": [24],
		"/sports/[id]": [23],
		"/teams": [25],
		"/teams/create": [27],
		"/teams/[id]": [26],
		"/workflow-test": [29],
		"/workflow": [28]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';