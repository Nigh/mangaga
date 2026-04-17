<script lang="ts">
	export let gridCols = 2
	export let canvasBgColor = "#ffffff"
	export let canvasPaddingPct = 0
	export let cellGapPct = 0
	export let panelPaddingPct = 0
	export let panelBorderPct = 0
	export let panelBorderColor = "#000000"
	export let exportOutputScale = 1

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
</script>

<div class="divider my-0 text-sm font-medium">样式与导出</div>

<div class="flex flex-col gap-5">
	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">列数 (1–4)</span>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => {
					gridCols = numStep(gridCols, 1, 4, 1, -1)
					onClampGridCols()
				}}
			>
				−
			</button>
			<input
				type="number"
				min="1"
				max="4"
				class="input input-bordered input-lg min-h-14 flex-1 text-center text-lg"
				bind:value={gridCols}
				on:change={onClampGridCols}
			/>
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => {
					gridCols = numStep(gridCols, 1, 4, 1, 1)
					onClampGridCols()
				}}
			>
				+
			</button>
		</div>
	</div>

	<label class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">全图背景色</span>
		<input type="color" bind:value={canvasBgColor} class="input input-bordered h-14 w-full min-h-14" />
	</label>

	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">全图外边距</span>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (canvasPaddingPct = numStep(canvasPaddingPct, 0, 30, pctStep, -1))}
			>
				−
			</button>
			<div class="join flex min-h-14 flex-1">
				<input
					type="number"
					min="0"
					max="30"
					step={pctStep}
					class="input input-bordered join-item min-h-14 flex-1 text-center text-lg"
					bind:value={canvasPaddingPct}
				/>
				<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-11 px-2 text-lg font-medium">%</span>
			</div>
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (canvasPaddingPct = numStep(canvasPaddingPct, 0, 30, pctStep, 1))}
			>
				+
			</button>
		</div>
		<p class="text-base-content/60 text-xs">约 {canvasPadPx} px</p>
	</div>

	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">格间距</span>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (cellGapPct = numStep(cellGapPct, 0, 30, pctStep, -1))}
			>
				−
			</button>
			<div class="join flex min-h-14 flex-1">
				<input
					type="number"
					min="0"
					max="30"
					step={pctStep}
					class="input input-bordered join-item min-h-14 flex-1 text-center text-lg"
					bind:value={cellGapPct}
				/>
				<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-11 px-2 text-lg font-medium">%</span>
			</div>
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (cellGapPct = numStep(cellGapPct, 0, 30, pctStep, 1))}
			>
				+
			</button>
		</div>
		<p class="text-base-content/60 text-xs">约 {gapPx} px</p>
	</div>

	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">图片内边距</span>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (panelPaddingPct = numStep(panelPaddingPct, 0, 30, pctStep, -1))}
			>
				−
			</button>
			<div class="join flex min-h-14 flex-1">
				<input
					type="number"
					min="0"
					max="30"
					step={pctStep}
					class="input input-bordered join-item min-h-14 flex-1 text-center text-lg"
					bind:value={panelPaddingPct}
				/>
				<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-11 px-2 text-lg font-medium">%</span>
			</div>
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (panelPaddingPct = numStep(panelPaddingPct, 0, 30, pctStep, 1))}
			>
				+
			</button>
		</div>
		<p class="text-base-content/60 text-xs">约 {panelPadPx} px</p>
	</div>

	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">单格描边</span>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (panelBorderPct = numStep(panelBorderPct, 0, 30, pctStep, -1))}
			>
				−
			</button>
			<div class="join flex min-h-14 flex-1">
				<input
					type="number"
					min="0"
					max="30"
					step={pctStep}
					class="input input-bordered join-item min-h-14 flex-1 text-center text-lg"
					bind:value={panelBorderPct}
				/>
				<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-11 px-2 text-lg font-medium">%</span>
			</div>
			<button
				type="button"
				class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
				on:click={() => (panelBorderPct = numStep(panelBorderPct, 0, 30, pctStep, 1))}
			>
				+
			</button>
		</div>
		<p class="text-base-content/60 text-xs">约 {borderPx} px</p>
	</div>

	<label class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">单格描边颜色</span>
		<input type="color" bind:value={panelBorderColor} class="input input-bordered h-14 w-full min-h-14" />
	</label>

	<div class="form-control gap-2">
		<span class="label-text text-sm font-medium md:text-base">导出缩放（约 {exportPixelW} × {exportPixelH} px）</span>
		<div class="flex flex-wrap items-center gap-3">
			{#each [1, 0.75, 0.5, 0.25] as r}
				<button
					type="button"
					class="btn btn-lg min-h-12 flex-1 sm:flex-none {exportOutputScale === r ? 'btn-primary' : 'btn-outline'}"
					on:click={() => (exportOutputScale = r)}
				>
					{Math.round(r * 100)}%
				</button>
			{/each}
			<button type="button" class="btn btn-primary btn-lg min-h-12 px-6 text-lg" on:click={onExportPng}>
				导出 PNG
			</button>
		</div>
		<p class="text-base-content/60 text-sm">
			逻辑尺寸 {Math.round(designOuterW)} × {Math.round(designOuterH)} px；基准边长 {Math.round(globalMaxEdge)} px
		</p>
	</div>
</div>
