<script lang="ts">
	import type { GridLayout } from "../../lib/mangaLayout"
	import { panelOuterRect } from "../../lib/mangaLayout"
	import type { MangaPanel } from "../../lib/mangagaTypes"

	export let selectedPanel: MangaPanel
	export let layout: GridLayout
	export let previewScale = 1
	export let canvasPadPx = 0
	export let canUp = false
	export let canDown = false
	export let canLeft = false
	export let canRight = false
	export let labels = {
		moveUp: "Move up",
		moveDown: "Move down",
		moveLeft: "Move left",
		moveRight: "Move right",
	}
	export let onDelta: (dCol: number, dRow: number) => void
	export let moveEnabled = true

	const btnSize = 38
	const btnColor = "rgba(59,130,246,0.9)"
	$: r = panelOuterRect(selectedPanel, layout)
	$: btnPx = btnSize * previewScale

	function handleDelta(dCol: number, dRow: number) {
		if (!moveEnabled) return
		onDelta(dCol, dRow)
	}
</script>

{#if selectedPanel}
	<div class="pointer-events-none absolute inset-0 z-10" data-mg-reorder-overlay>
		{#if canUp}
			<button
				type="button"
				class="btn btn-sm absolute min-h-9 min-w-9 rounded-full p-0 text-base font-bold shadow-md pointer-events-auto border-none"
				style="background-color: {btnColor}; color: #fff; left: {(canvasPadPx + r.x + r.w / 2) * previewScale}px; top: {(canvasPadPx + r.y + 18) * previewScale}px; width: {btnPx}px; height: {btnPx}px; transform: translate(-50%, -50%);"
				aria-label={labels.moveUp}
				on:click|stopPropagation={() => handleDelta(0, -1)}
			>
				↑
			</button>
		{/if}
		{#if canDown}
			<button
				type="button"
				class="btn btn-sm absolute min-h-9 min-w-9 rounded-full p-0 text-base font-bold shadow-md pointer-events-auto border-none"
				style="background-color: {btnColor}; color: #fff; left: {(canvasPadPx + r.x + r.w / 2) * previewScale}px; top: {(canvasPadPx + r.y + r.h - 18) * previewScale}px; width: {btnPx}px; height: {btnPx}px; transform: translate(-50%, -50%);"
				aria-label={labels.moveDown}
				on:click|stopPropagation={() => handleDelta(0, 1)}
			>
				↓
			</button>
		{/if}
		{#if canLeft}
			<button
				type="button"
				class="btn btn-sm absolute min-h-9 min-w-9 rounded-full p-0 text-base font-bold shadow-md pointer-events-auto border-none"
				style="background-color: {btnColor}; color: #fff; left: {(canvasPadPx + r.x + 18) * previewScale}px; top: {(canvasPadPx + r.y + r.h / 2) * previewScale}px; width: {btnPx}px; height: {btnPx}px; transform: translate(-50%, -50%);"
				aria-label={labels.moveLeft}
				on:click|stopPropagation={() => handleDelta(-1, 0)}
			>
				←
			</button>
		{/if}
		{#if canRight}
			<button
				type="button"
				class="btn btn-sm absolute min-h-9 min-w-9 rounded-full p-0 text-base font-bold shadow-md pointer-events-auto border-none"
				style="background-color: {btnColor}; color: #fff; left: {(canvasPadPx + r.x + r.w - 18) * previewScale}px; top: {(canvasPadPx + r.y + r.h / 2) * previewScale}px; width: {btnPx}px; height: {btnPx}px; transform: translate(-50%, -50%);"
				aria-label={labels.moveRight}
				on:click|stopPropagation={() => handleDelta(1, 0)}
			>
				→
			</button>
		{/if}
	</div>
{/if}
