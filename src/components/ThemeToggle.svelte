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

<button
	class="btn btn-sm btn-outline fixed top-4 right-4 z-50"
	type="button"
	on:click={toggleTheme}
	aria-label="Toggle theme"
>
	{theme === "xianii-light" ? "🌙 Dark" : "☀️ Light"}
</button>
