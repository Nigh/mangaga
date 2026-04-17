<script lang="ts">
	import { onMount } from "svelte"

	type Theme = "xianii-light" | "xianii-dark"
	const THEME_KEY = "theme"

	let theme: Theme = "xianii-light"

	const applyTheme = (nextTheme: Theme) => {
		theme = nextTheme
		document.documentElement.setAttribute("data-theme", nextTheme)
		localStorage.setItem(THEME_KEY, nextTheme)
	}

	onMount(() => {
		const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null

		if (savedTheme === "xianii-light" || savedTheme === "xianii-dark") {
			applyTheme(savedTheme)
			return
		}

		const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
		applyTheme(systemPrefersDark ? "xianii-dark" : "xianii-light")
	})

	const toggleTheme = () => {
		applyTheme(theme === "xianii-light" ? "xianii-dark" : "xianii-light")
	}
</script>

<header
	class="border-base-300 bg-base-200/95 supports-[backdrop-filter]:bg-base-200/80 sticky top-0 z-20 flex w-full shrink-0 items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md md:gap-6 md:px-6"
>
	<a
		href="https://github.com/Nigh/mangaga"
		target="_blank"
		rel="noopener noreferrer"
		class="btn btn-outline btn-primary h-12 min-h-12 shrink-0 gap-2.5 rounded-xl px-4 text-base font-bold tracking-wide"
		aria-label="Star on GitHub"
		title="GitHub"
	>
		<svg
			class="h-8 w-8 shrink-0"
			viewBox="0 0 98 96"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				fill="currentColor"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.096-.08-9.211-13.591 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
			/>
		</svg>
		<span>STAR</span>
	</a>

	<button
		type="button"
		class="btn btn-outline border-base-300 h-12 min-h-12 shrink-0 gap-2.5 px-4 text-base font-medium"
		on:click={toggleTheme}
		aria-label={theme === "xianii-light" ? "Switch to dark theme" : "Switch to light theme"}
	>
		{#if theme === "xianii-light"}
			<svg
				class="h-8 w-8 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.75"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
				/>
			</svg>
			<span class="hidden sm:inline">Dark</span>
		{:else}
			<svg
				class="h-8 w-8 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.75"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
				/>
			</svg>
			<span class="hidden sm:inline">Light</span>
		{/if}
	</button>
</header>
