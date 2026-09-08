<script lang="ts">
	export let previewWrapEl: HTMLDivElement
	export let canvasEl: HTMLCanvasElement

	export let displayW = 0
	export let useTouchDragMode = false
	export let empty = false
	export let emptyMessage = ""

	export let onCanvasPointerDown: (e: PointerEvent) => void
	export let onCanvasPointerMove: (e: PointerEvent) => void
	export let onCanvasPointerUp: (e: PointerEvent) => void
</script>

<div
	bind:this={previewWrapEl}
	class="bg-base-300/40 border-base-300 flex w-full max-w-full justify-center rounded-2xl border-2 p-2 md:p-3"
>
	<div class="relative block max-w-full" style="width: {displayW}px; min-width: min(100%, {displayW}px);">
		{#if empty}
			<div
				class="bg-base-300/40 border-base-300 text-base-content/60 flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm md:text-base"
			>
				<svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
				</svg>
				<span>{emptyMessage}</span>
			</div>
		{:else}
			<canvas
				bind:this={canvasEl}
				class="bg-base-100 block max-w-full"
				style="touch-action: {useTouchDragMode ? 'none' : 'pan-y pinch-zoom'};"
				on:pointerdown={onCanvasPointerDown}
				on:pointermove={onCanvasPointerMove}
				on:pointerup={onCanvasPointerUp}
				on:pointercancel={onCanvasPointerUp}
			></canvas>
		{/if}
		<slot />
	</div>
</div>
