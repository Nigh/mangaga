<script lang="ts">
	export let gridCols = 2
	export let canvasBgColor = "#ffffff"
	export let canvasPaddingPct = 0
	export let cellGapPct = 0
	export let panelPaddingPct = 0
	export let panelBorderPct = 0
	export let panelBorderColor = "#000000"
	export let panelBorderOpacity = 100
	export let exportOutputScale = 1
	export 	let exportFormat: "image/png" | "image/jpeg" | "image/webp" = "image/png"
	export let exportQuality = 85

	export let hasPanels = false
	export let estimatedSize: number | null = null

	export let pctStep = 1
	export let gapPx = 0
	export let canvasPadPx = 0
	export let panelPadPx = 0
	export let borderPx = 0
	export let exportPixelW = 0
	export let exportPixelH = 0
	export let designOuterW = 0
	export let designOuterH = 0
	export let globalMaxEdge = 1

	export let numStep: (
		v: number,
		min: number,
		max: number,
		stepVal: number,
		delta: number,
	) => number
	export let onClampGridCols: () => void
	export let onExportPng: () => void
	export let labels = {
		panelStyleAndExport: "Style & Export",
		gridCols: "Columns (1-4)",
		canvasBgColor: "Canvas Background",
		canvasPadding: "Canvas Padding",
		cellGap: "Cell Gap",
		panelPadding: "Image Padding",
		panelBorder: "Panel Border",
		panelBorderColor: "Panel Border Color",
		borderOpacity: "Border Opacity",
		exportPng: "Export PNG",
		exportFormat: "Format",
		exportQuality: "Quality",
		estimatedSize: "Est. size",
		approxPx: (px: number) => `about ${px} px`,
		exportScaleLabel: (w: number, h: number) => `Export Scale (about ${w} × ${h} px)`,
		logicSizeLabel: (w: number, h: number, edge: number) =>
			`Logical size ${w} × ${h} px; base edge ${edge} px`,
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	function makeStepper(
		getter: () => number,
		setter: (v: number) => void,
		min: number,
		max: number,
	) {
		return {
			get value() { return getter() },
			step(d: number) { setter(numStep(getter(), min, max, pctStep, d)) },
		}
	}

	$: padCtrl = makeStepper(() => canvasPaddingPct, (v) => (canvasPaddingPct = v), 0, 30)
	$: gapCtrl = makeStepper(() => cellGapPct, (v) => (cellGapPct = v), 0, 30)
	$: imgPadCtrl = makeStepper(() => panelPaddingPct, (v) => (panelPaddingPct = v), 0, 30)
	$: imgBorderCtrl = makeStepper(() => panelBorderPct, (v) => (panelBorderPct = v), 0, 30)
</script>

<div class="divider my-0 text-sm font-medium">{labels.panelStyleAndExport}</div>

<div class="flex flex-col gap-3">
	<div class="bg-base-200 rounded p-3">
		<span class="mb-2 block text-xs font-medium">{labels.gridCols}</span>
		<div class="flex gap-2">
			{#each [1, 2, 3, 4] as c}
				<button
					type="button"
					class="btn btn-sm min-h-10 flex-1 {gridCols === c ? 'btn-primary' : 'btn-outline'}"
					on:click={() => { gridCols = c; onClampGridCols() }}
				>
					{c}
				</button>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="bg-base-200 rounded p-3">
			<span class="mb-2 block text-xs font-medium">{labels.canvasBgColor}</span>
			<input type="color" bind:value={canvasBgColor} class="input input-bordered min-h-10 w-full" />
		</div>
		<div class="bg-base-200 rounded p-3">
			<span class="mb-2 block text-xs font-medium">{labels.panelBorderColor}</span>
			<input type="color" bind:value={panelBorderColor} class="input input-bordered min-h-10 w-full" />
			<div class="mt-2 flex items-center gap-1 sm:hidden">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => (panelBorderOpacity = Math.max(0, panelBorderOpacity - 5))}>−</button>
				<span class="flex-1 text-center text-xs">{panelBorderOpacity}%</span>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => (panelBorderOpacity = Math.min(100, panelBorderOpacity + 5))}>+</button>
			</div>
			<div class="mt-2 hidden items-center gap-2 sm:flex">
				<input type="range" min="0" max="100" step="1" bind:value={panelBorderOpacity} class="range range-xs range-primary flex-1" />
				<span class="text-base-content/60 text-xs w-8 text-right">{panelBorderOpacity}%</span>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="bg-base-200 rounded p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium">{labels.canvasPadding}</span>
				<span class="text-base-content/60 text-xs">{labels.approxPx(canvasPadPx)}</span>
			</div>
			<div class="flex items-center gap-1 sm:hidden">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => padCtrl.step(-1)}>−</button>
				<span class="flex-1 text-center text-sm">{canvasPaddingPct}%</span>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => padCtrl.step(1)}>+</button>
			</div>
			<div class="hidden items-center gap-1 sm:flex">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => padCtrl.step(-1)}>−</button>
				<div class="join flex min-h-10 flex-1">
					<input type="number" min="0" max="30" step={pctStep} class="input input-bordered join-item min-h-10 flex-1 text-center" bind:value={canvasPaddingPct} />
					<span class="btn btn-outline join-item border-base-300 pointer-events-none min-h-10 px-2 text-xs">%</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => padCtrl.step(1)}>+</button>
			</div>
		</div>

		<div class="bg-base-200 rounded p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium">{labels.cellGap}</span>
				<span class="text-base-content/60 text-xs">{labels.approxPx(gapPx)}</span>
			</div>
			<div class="flex items-center gap-1 sm:hidden">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => gapCtrl.step(-1)}>−</button>
				<span class="flex-1 text-center text-sm">{cellGapPct}%</span>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => gapCtrl.step(1)}>+</button>
			</div>
			<div class="hidden items-center gap-1 sm:flex">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => gapCtrl.step(-1)}>−</button>
				<div class="join flex min-h-10 flex-1">
					<input type="number" min="0" max="30" step={pctStep} class="input input-bordered join-item min-h-10 flex-1 text-center" bind:value={cellGapPct} />
					<span class="btn btn-outline join-item border-base-300 pointer-events-none min-h-10 px-2 text-xs">%</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => gapCtrl.step(1)}>+</button>
			</div>
		</div>

		<div class="bg-base-200 rounded p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium">{labels.panelPadding}</span>
				<span class="text-base-content/60 text-xs">{labels.approxPx(panelPadPx)}</span>
			</div>
			<div class="flex items-center gap-1 sm:hidden">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => imgPadCtrl.step(-1)}>−</button>
				<span class="flex-1 text-center text-sm">{panelPaddingPct}%</span>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => imgPadCtrl.step(1)}>+</button>
			</div>
			<div class="hidden items-center gap-1 sm:flex">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => imgPadCtrl.step(-1)}>−</button>
				<div class="join flex min-h-10 flex-1">
					<input type="number" min="0" max="30" step={pctStep} class="input input-bordered join-item min-h-10 flex-1 text-center" bind:value={panelPaddingPct} />
					<span class="btn btn-outline join-item border-base-300 pointer-events-none min-h-10 px-2 text-xs">%</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => imgPadCtrl.step(1)}>+</button>
			</div>
		</div>

		<div class="bg-base-200 rounded p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium">{labels.panelBorder}</span>
				<span class="text-base-content/60 text-xs">{labels.approxPx(borderPx)}</span>
			</div>
			<div class="flex items-center gap-1 sm:hidden">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => imgBorderCtrl.step(-1)}>−</button>
				<span class="flex-1 text-center text-sm">{panelBorderPct}%</span>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-8 text-lg" on:click={() => imgBorderCtrl.step(1)}>+</button>
			</div>
			<div class="hidden items-center gap-1 sm:flex">
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => imgBorderCtrl.step(-1)}>−</button>
				<div class="join flex min-h-10 flex-1">
					<input type="number" min="0" max="30" step={pctStep} class="input input-bordered join-item min-h-10 flex-1 text-center" bind:value={panelBorderPct} />
					<span class="btn btn-outline join-item border-base-300 pointer-events-none min-h-10 px-2 text-xs">%</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm min-h-10 min-w-10 text-lg" on:click={() => imgBorderCtrl.step(1)}>+</button>
			</div>
		</div>
	</div>

	<div class="bg-base-200 rounded p-3">
		<span class="mb-2 block text-xs font-medium">{labels.exportScaleLabel(exportPixelW, exportPixelH)}</span>
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex w-full gap-2">
				{#each [1, 0.75, 0.5, 0.25] as r}
					<button
						type="button"
						class="btn btn-sm btn-ghost min-h-10 flex-1 border {exportOutputScale === r ? 'btn-active border-primary' : 'border-base-300'}"
						on:click={() => (exportOutputScale = r)}
					>
						{Math.round(r * 100)}%
					</button>
				{/each}
			</div>
			<div class="flex w-full gap-2">
				{#each [["PNG", "image/png"], ["JPEG", "image/jpeg"], ["WebP", "image/webp"]] as [label, mime]}
					<button
						type="button"
						class="btn btn-sm btn-ghost min-h-10 flex-1 border {exportFormat === mime ? 'btn-active border-primary' : 'border-base-300'}"
						on:click={() => (exportFormat = mime)}
					>
						{label}
					</button>
				{/each}
			</div>
			<div class="flex w-full items-center gap-2">
				<span class="text-base-content/60 text-xs whitespace-nowrap">{labels.exportQuality}</span>
				<input type="range" min="10" max="100" step="5" bind:value={exportQuality} class="range range-xs range-primary flex-1" />
				<span class="text-base-content/60 text-xs w-8 text-right">{exportQuality}%</span>
			</div>
			{#if hasPanels && estimatedSize != null}
				<p class="text-base-content/60 w-full text-center text-xs">{labels.estimatedSize}: ~{formatBytes(estimatedSize)}</p>
			{/if}
			<button type="button" class="btn btn-primary btn-sm min-h-10 w-full text-base font-semibold" disabled={!hasPanels} on:click={onExportPng}>
				{labels.exportPng}
			</button>
		</div>
		<p class="text-base-content/60 mt-2 text-xs">
			{labels.logicSizeLabel(
				Math.round(designOuterW),
				Math.round(designOuterH),
				Math.round(globalMaxEdge),
			)}
		</p>
	</div>
</div>
