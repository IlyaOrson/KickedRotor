// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeKatexSvelte from "rehype-katex-svelte";
import remarkMath from 'remark-math'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	extensions: ['.svelte', '.md'],

	preprocess: [mdsvex({
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatexSvelte],
		extensions: ['.md']
	}), vitePreprocess()],

	kit: {
		adapter: adapter(),
		paths: {
			base: process.env.BASE_PATH
		},
	}
};

export default config;
