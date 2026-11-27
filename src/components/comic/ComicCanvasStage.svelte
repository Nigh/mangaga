<script lang="ts">
	export let previewWrapEl: HTMLDivElement
	export let canvasEl: HTMLCanvasElement

	export let displayW = 0
	export let useTouchDragMode = false
	export let empty = false
	export let emptyMessage = ""
	export let dropHint = ""
	export let dropActiveHint = ""
	export let onDropFiles: (files: File[]) => void

	export let onCanvasPointerDown: (e: PointerEvent) => void
	export let onCanvasPointerMove: (e: PointerEvent) => void
	export let onCanvasPointerUp: (e: PointerEvent) => void

	let fileDragActive = false

	function carriesFiles(e: DragEvent): boolean {
		const transfer = e.dataTransfer
		return !!transfer && (Array.from(transfer.types).includes("Files") || Array.from(transfer.items).some((item) => item.kind === "file"))
	}

	function onFileDragEnter(e: DragEvent) {
		if (!carriesFiles(e)) return
		e.preventDefault()
		fileDragActive = true
	}

	function onFileDragOver(e: DragEvent) {
		if (!carriesFiles(e)) return
		e.preventDefault()
		fileDragActive = true
		if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
	}

	function onFileDragLeave(e: DragEvent) {
		if (!carriesFiles(e)) return
		if (e.relatedTarget instanceof Node && e.currentTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return
		fileDragActive = false
	}

	function onFileDrop(e: DragEvent) {
		const files = Array.from(e.dataTransfer?.files ?? [])
		if (!files.length && !carriesFiles(e)) return
		e.preventDefault()
		fileDragActive = false
		if (files.length) onDropFiles(files)
	}
</script>

<div
	bind:this={previewWrapEl}
	class="canvas-stage bg-base-300/40 border-base-300 relative flex w-full max-w-full justify-center rounded-xl border p-2 md:p-3"
	class:drag-active={fileDragActive}
	role="region"
	aria-label={dropHint}
	on:dragenter={onFileDragEnter}
	on:dragover={onFileDragOver}
	on:dragleave={onFileDragLeave}
	on:drop={onFileDrop}
>
	{#if fileDragActive}
		<div class="pointer-events-none absolute inset-1 z-20 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-base-100/90 p-4 text-center">
			<div class="border-base-300 bg-base-100 rounded-xl border px-5 py-4 shadow-md">
				<p class="text-base-content font-semibold">{dropActiveHint}</p>
				<p class="text-base-content/70 mt-1 text-sm">{dropHint}</p>
			</div>
		</div>
	{/if}
	<div
		class="relative block max-w-full"
		style={empty ? "width: 100%; min-width: 100%;" : `width: ${displayW}px; min-width: min(100%, ${displayW}px);`}
	>
		{#if empty}
			<div
				class="bg-base-100 border-base-300 text-base-content/70 flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center text-sm md:min-h-72 md:text-base"
			>
				<svg class="text-primary h-10 w-10" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
				</svg>
				<span class="max-w-[28ch] font-medium leading-relaxed">{emptyMessage}</span>
				<span class="text-base-content/60 text-xs leading-relaxed">{dropHint}</span>
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

<style>
	.canvas-stage.drag-active {
		border-color: var(--color-primary);
	}
</style>
