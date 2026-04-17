<script lang="ts">
	export let previewWrapEl: HTMLDivElement
	export let canvasEl: HTMLCanvasElement

	export let displayW = 0
	export let maxHeight = "min(75vh, 880px)"
	export let useTouchDragMode = false

	export let onCanvasPointerDown: (e: PointerEvent) => void
	export let onCanvasPointerMove: (e: PointerEvent) => void
	export let onCanvasPointerUp: (e: PointerEvent) => void
</script>

<div
	bind:this={previewWrapEl}
	class="bg-base-300/40 border-base-300 w-full max-w-full overflow-auto rounded-2xl border-2 p-2 md:p-3"
	style="max-height: {maxHeight};"
>
	<div class="relative mx-auto inline-block max-w-full" style="width: {displayW}px; min-width: min(100%, {displayW}px);">
		<canvas
			bind:this={canvasEl}
			class="bg-base-100 block max-w-full"
			style="touch-action: {useTouchDragMode ? 'none' : 'pan-y pinch-zoom'};"
			on:pointerdown={onCanvasPointerDown}
			on:pointermove={onCanvasPointerMove}
			on:pointerup={onCanvasPointerUp}
			on:pointercancel={onCanvasPointerUp}
		></canvas>
		<slot />
	</div>
</div>
