import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Proxy API requests to the backend during development
			'/api': {
				target: 'http://localhost:5000',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
