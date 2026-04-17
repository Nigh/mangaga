<script lang="ts">
	import type { GridLayout } from "../../lib/mangaLayout"
	import { panelOuterRect } from "../../lib/mangaLayout"
	import type { MangaPanel } from "../../lib/mangagaTypes"

	export let selectedPanel: MangaPanel | null = null
	export let layout: GridLayout
	export let previewScale = 1
	export let canvasPadPx = 0

	export let canShrinkW = false
	export let canExpandW = false
	export let canShrinkH = false
	export let canExpandH = false

	export let onRemove: () => void
	export let onDeltaSpan: (dCol: number, dRow: number) => void
	export let labels = {
		delete: "Delete",
		shrinkWidth: "Narrow",
		expandWidth: "Widen",
		shrinkHeight: "Shorten",
		expandHeight: "Heighten",
	}

	function overlayCenter(
		innerCx: number,
		innerCy: number,
		innerW: number,
		innerH: number,
	) {
		const s = previewScale
		const pad = canvasPadPx
		return {
			left: (pad + innerCx) * s,
			top: (pad + innerCy) * s,
			width: innerW * s,
			height: innerH * s,
		}
	}
</script>

{#if selectedPanel}
	{@const r = panelOuterRect(selectedPanel, layout)}
	{@const del = overlayCenter(r.x + r.w / 2, r.y + r.h / 2, 40, 40)}
	<div class="pointer-events-none absolute inset-0 z-10" data-mg-selection-ui>
		<button
			type="button"
			data-remove
			class="btn btn-error btn-sm pointer-events-auto absolute min-h-10 min-w-10 rounded-full p-0 text-lg font-bold shadow-md"
			style="left: {del.left}px; top: {del.top}px; width: {del.width}px; height: {del.height}px; transform: translate(-50%, -50%);"
			aria-label={labels.delete}
			on:click|stopPropagation={onRemove}
		>
			×
		</button>
		{#if canShrinkW}
			{@const b = overlayCenter(r.x + 20, r.y + r.h / 2, 40, 44)}
			<button
				type="button"
				class="btn btn-primary btn-sm pointer-events-auto absolute min-h-11 min-w-11 p-0 text-xl"
				style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
				aria-label={labels.shrinkWidth}
				on:click|stopPropagation={() => onDeltaSpan(-1, 0)}
			>
				←
			</button>
		{/if}
		{#if canExpandW}
			{@const b = overlayCenter(r.x + r.w - 20, r.y + r.h / 2, 40, 44)}
			<button
				type="button"
				class="btn btn-primary btn-sm pointer-events-auto absolute min-h-11 min-w-11 p-0 text-xl"
				style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
				aria-label={labels.expandWidth}
				on:click|stopPropagation={() => onDeltaSpan(1, 0)}
			>
				→
			</button>
		{/if}
		{#if canShrinkH}
			{@const b = overlayCenter(r.x + r.w / 2, r.y + 22, 44, 40)}
			<button
				type="button"
				class="btn btn-primary btn-sm pointer-events-auto absolute min-h-10 min-w-12 p-0 text-xl"
				style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
				aria-label={labels.shrinkHeight}
				on:click|stopPropagation={() => onDeltaSpan(0, -1)}
			>
				↑
			</button>
		{/if}
		{#if canExpandH}
			{@const b = overlayCenter(r.x + r.w / 2, r.y + r.h - 22, 44, 40)}
			<button
				type="button"
				class="btn btn-primary btn-sm pointer-events-auto absolute min-h-10 min-w-12 p-0 text-xl"
				style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
				aria-label={labels.expandHeight}
				on:click|stopPropagation={() => onDeltaSpan(0, 1)}
			>
				↓
			</button>
		{/if}
	</div>
{/if}
