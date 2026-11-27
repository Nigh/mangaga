<script lang="ts">
	import { onDestroy, onMount } from "svelte"

	export let labels: { scrollToTop: string; scrollToBottom: string }

	let atTop = true
	let atBottom = false

	function onScroll() {
		const scrollY = window.scrollY
		atTop = scrollY < 40
		atBottom = scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40
	}

	function scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
		})
	}

	function scrollToBottom() {
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
		})
	}

	onMount(() => {
		onScroll()
		window.addEventListener("scroll", onScroll, { passive: true })
	})

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("scroll", onScroll)
		}
	})
</script>

<div class="fixed right-3 bottom-20 z-40 flex flex-col gap-2 md:hidden">
	<button
		type="button"
		class="btn btn-circle btn-sm bg-base-100/80 border-base-300/60 text-base-content/70 shadow-lg backdrop-blur-sm {atTop
			? 'pointer-events-none opacity-0'
			: ''}"
		aria-label={labels.scrollToTop}
		disabled={atTop}
		on:click={scrollToTop}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
		</svg>
	</button>
	<button
		type="button"
		class="btn btn-circle btn-sm bg-base-100/80 border-base-300/60 text-base-content/70 shadow-lg backdrop-blur-sm {atBottom
			? 'pointer-events-none opacity-0'
			: ''}"
		aria-label={labels.scrollToBottom}
		disabled={atBottom}
		on:click={scrollToBottom}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
</div>
