<script lang="ts">
	import { onDestroy, onMount, tick } from "svelte"
	import {
		computeGridTracks,
		maxCellLongestEdge,
		panelOuterRect,
		snapCol,
		snapRow,
	} from "../lib/mangaLayout"
	import { drawPanel, drawPanelInRect } from "../lib/mangaDraw"
	import { percentStepForMaxEdge } from "../lib/mangaPctStep"

	type Panel = {
		id: string
		col: number
		row: number
		colSpan: number
		rowSpan: number
		src: string
		nw: number
		nh: number
	}

	let gridCols = 2
	let gridRows = 2

	/** 相对「格最长边」基准的百分比，范围 0–30；四边同一数值 */
	let canvasPaddingPct = 2
	let canvasBgColor = "#ffffff"

	let panelPaddingPct = 0
	let panelBorderPct = 0.5
	let panelBorderColor = "#000000"

	let cellGapPct = 1

	let exportOutputScale = 1

	let panels: Panel[] = []
	let fileInput: HTMLInputElement

	let canvasEl: HTMLCanvasElement
	let previewWrapEl: HTMLDivElement
	let previewContainerW = 0
	let message = ""
	let selectedId: string | null = null

	const imgMap = new Map<string, HTMLImageElement>()

	let dragId: string | null = null
	let grabDx = 0
	let grabDy = 0
	let dragInnerX = 0
	let dragInnerY = 0

	/** 先用 gap=0 量出轨道，再算全局最长边作百分比基准 */
	$: layoutMeasure = computeGridTracks(gridCols, gridRows, panels, 0)
	$: globalMaxEdge = maxCellLongestEdge(layoutMeasure)
	$: pctStep = percentStepForMaxEdge(globalMaxEdge)
	$: gapPx = Math.round(
		(globalMaxEdge * Math.min(30, Math.max(0, cellGapPct))) / 100,
	)
	$: canvasPadPx = Math.round(
		(globalMaxEdge * Math.min(30, Math.max(0, canvasPaddingPct))) / 100,
	)
	$: panelPadPx = Math.round(
		(globalMaxEdge * Math.min(30, Math.max(0, panelPaddingPct))) / 100,
	)
	$: borderPx = Math.round(
		(globalMaxEdge * Math.min(30, Math.max(0, panelBorderPct))) / 100,
	)

	$: layout = computeGridTracks(gridCols, gridRows, panels, gapPx)
	$: designInnerW = layout.innerW
	$: designInnerH = layout.innerH
	$: designOuterW = canvasPadPx * 2 + designInnerW
	$: designOuterH = canvasPadPx * 2 + designInnerH

	$: previewScale =
		previewContainerW > 0
			? Math.min(1, Math.max(0.05, (previewContainerW - 24) / Math.max(1, designOuterW)))
			: 1

	$: displayW = designOuterW * previewScale
	$: displayH = designOuterH * previewScale

	$: exportPixelW = Math.max(1, Math.round(designOuterW * exportOutputScale))
	$: exportPixelH = Math.max(1, Math.round(designOuterH * exportOutputScale))

	let ro: ResizeObserver

	function showMsg(text: string) {
		message = text
		setTimeout(() => {
			message = ""
		}, 2800)
	}

	function overlap(
		col: number,
		row: number,
		cs: number,
		rs: number,
		q: Panel,
	): boolean {
		return (
			col < q.col + q.colSpan &&
			col + cs > q.col &&
			row < q.row + q.rowSpan &&
			row + rs > q.row
		)
	}

	function canPlace(
		col: number,
		row: number,
		cs: number,
		rs: number,
		ignoreId?: string,
	): boolean {
		if (col < 0 || row < 0) return false
		if (col + cs > gridCols || row + rs > gridRows) return false
		for (const q of panels) {
			if (q.id === ignoreId) continue
			if (overlap(col, row, cs, rs, q)) return false
		}
		return true
	}

	function canPlaceIgnoring(
		col: number,
		row: number,
		cs: number,
		rs: number,
		ignore: Set<string>,
	): boolean {
		if (col < 0 || row < 0) return false
		if (col + cs > gridCols || row + rs > gridRows) return false
		for (const q of panels) {
			if (ignore.has(q.id)) continue
			if (overlap(col, row, cs, rs, q)) return false
		}
		return true
	}

	function syncRowsFromPanels() {
		let maxR = 2
		for (const p of panels) maxR = Math.max(maxR, p.row + p.rowSpan)
		if (gridRows < maxR) gridRows = maxR
	}

	function findFreeSlot(cs: number, rs: number): { col: number; row: number } | null {
		for (let row = 0; row <= gridRows - rs; row++) {
			for (let col = 0; col <= gridCols - cs; col++) {
				if (canPlace(col, row, cs, rs)) return { col, row }
			}
		}
		return null
	}

	function growGridAndFindSlot(cs: number, rs: number): { col: number; row: number } | null {
		for (let i = 0; i < 40; i++) {
			const s = findFreeSlot(cs, rs)
			if (s) return s
			gridRows += 1
		}
		return null
	}

	function isImageFile(file: File) {
		if (file.type && file.type.startsWith("image/")) return true
		return /\.(jpe?g|png|gif|webp|bmp|heif|heic|avif)$/i.test(file.name)
	}

	function loadImageSize(src: string): Promise<{ nw: number; nh: number }> {
		return new Promise((res, rej) => {
			const i = new Image()
			i.onload = () => res({ nw: i.naturalWidth || 1, nh: i.naturalHeight || 1 })
			i.onerror = () => rej(new Error("decode"))
			i.src = src
		})
	}

	function ensureImage(p: Panel): Promise<void> {
		if (imgMap.has(p.id)) return Promise.resolve()
		return new Promise((res) => {
			const img = new Image()
			img.onload = () => {
				imgMap.set(p.id, img)
				res()
			}
			img.onerror = () => res()
			img.src = p.src
		})
	}

	async function loadAllImages() {
		await Promise.all(panels.map((p) => ensureImage(p)))
	}

	function eventToLogical(e: { clientX: number; clientY: number }): { x: number; y: number } {
		if (!canvasEl) return { x: 0, y: 0 }
		const rect = canvasEl.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * designOuterW
		const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * designOuterH
		return { x, y }
	}

	function innerFromEvent(e: { clientX: number; clientY: number }): { x: number; y: number } {
		const l = eventToLogical(e)
		return { x: l.x - canvasPadPx, y: l.y - canvasPadPx }
	}

	function drawPreview() {
		if (!canvasEl || typeof designOuterW !== "number") return
		const ctx = canvasEl.getContext("2d")
		if (!ctx) return

		const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
		const dw = displayW
		const dh = displayH
		canvasEl.width = Math.max(1, Math.round(dw * dpr))
		canvasEl.height = Math.max(1, Math.round(dh * dpr))
		canvasEl.style.width = `${dw}px`
		canvasEl.style.height = `${dh}px`

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		ctx.scale(previewScale, previewScale)

		ctx.fillStyle = canvasBgColor
		ctx.fillRect(0, 0, designOuterW, designOuterH)

		ctx.save()
		ctx.translate(canvasPadPx, canvasPadPx)

		for (const p of panels) {
			const img = imgMap.get(p.id) ?? null
			const r = panelOuterRect(p, layout)
			if (dragId === p.id) {
				drawPanel(ctx, p, layout, img, panelPadPx, borderPx, panelBorderColor, 0.2)
				const rr = { x: dragInnerX, y: dragInnerY, w: r.w, h: r.h }
				drawPanelInRect(ctx, rr, img, panelPadPx, borderPx, panelBorderColor, 1)
			} else {
				drawPanel(ctx, p, layout, img, panelPadPx, borderPx, panelBorderColor, 1)
			}
		}

		if (selectedId) {
			const sp = panels.find((x) => x.id === selectedId)
			if (sp) {
				const r = panelOuterRect(sp, layout)
				ctx.strokeStyle = "#e11d48"
				ctx.lineWidth = 3 / previewScale
				ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2)
			}
		}

		ctx.restore()
	}

	async function scheduleDraw() {
		await tick()
		await loadAllImages()
		drawPreview()
	}

	$: {
		panels
		layoutMeasure
		globalMaxEdge
		cellGapPct
		canvasPaddingPct
		panelPaddingPct
		panelBorderPct
		layout
		selectedId
		dragId
		dragInnerX
		dragInnerY
		canvasBgColor
		panelPadPx
		borderPx
		panelBorderColor
		previewScale
		displayW
		designOuterW
		designOuterH
		canvasPadPx
		gapPx
		previewContainerW
		void scheduleDraw()
	}

	async function onPickFiles(e: Event) {
		const input = e.target as HTMLInputElement
		const list = input.files ? Array.from(input.files) : []
		input.value = ""
		for (const file of list) {
			if (!isImageFile(file)) continue
			const src = URL.createObjectURL(file)
			let nw = 1
			let nh = 1
			try {
				const dim = await loadImageSize(src)
				nw = dim.nw
				nh = dim.nh
			} catch {
				URL.revokeObjectURL(src)
				showMsg("无法读取图片，请换一张试试")
				continue
			}
			let slot = findFreeSlot(1, 1)
			if (!slot) slot = growGridAndFindSlot(1, 1)
			if (!slot) {
				URL.revokeObjectURL(src)
				showMsg("无法放入网格")
				break
			}
			const id = crypto.randomUUID()
			panels = [
				...panels,
				{
					id,
					col: slot.col,
					row: slot.row,
					colSpan: 1,
					rowSpan: 1,
					src,
					nw,
					nh,
				},
			]
			selectedId = id
			syncRowsFromPanels()
		}
	}

	function removePanel(id: string) {
		const p = panels.find((x) => x.id === id)
		if (p) {
			URL.revokeObjectURL(p.src)
			imgMap.delete(id)
		}
		panels = panels.filter((x) => x.id !== id)
		if (selectedId === id) selectedId = null
		syncRowsFromPanels()
	}

	function clearAll() {
		for (const p of panels) {
			URL.revokeObjectURL(p.src)
			imgMap.delete(p.id)
		}
		panels = []
		selectedId = null
		gridRows = 2
	}

	/** 列数变少等情况下按阅读顺序重新装箱，避免格重叠 */
	function reflowPanelsPack(): void {
		if (!panels.length) return
		const sorted = [...panels].sort((a, b) => a.row - b.row || a.col - b.col)
		const pos = new Map<string, { col: number; row: number }>()

		function overlap(
			c1: number,
			r1: number,
			w1: number,
			h1: number,
			c2: number,
			r2: number,
			w2: number,
			h2: number,
		): boolean {
			return c1 < c2 + w2 && c1 + w1 > c2 && r1 < r2 + h2 && r1 + h1 > r2
		}

		function hits(
			col: number,
			row: number,
			cs: number,
			rs: number,
			skipId: string,
		): boolean {
			for (const [id, pr] of pos) {
				if (id === skipId) continue
				const q = panels.find((x) => x.id === id)!
				if (overlap(col, row, cs, rs, pr.col, pr.row, q.colSpan, q.rowSpan))
					return true
			}
			return false
		}

		for (const p of sorted) {
			p.colSpan = Math.min(Math.max(1, p.colSpan), gridCols)
			let placed = false
			while (!placed) {
				for (let row = 0; row < gridRows && !placed; row++) {
					for (let col = 0; col <= gridCols - p.colSpan && !placed; col++) {
						if (row + p.rowSpan > gridRows) continue
						if (!hits(col, row, p.colSpan, p.rowSpan, p.id)) {
							pos.set(p.id, { col, row })
							placed = true
						}
					}
				}
				if (!placed) gridRows += 1
			}
		}

		for (const p of panels) {
			const pr = pos.get(p.id)
			if (pr) {
				p.col = pr.col
				p.row = pr.row
			}
		}
		syncRowsFromPanels()
		panels = [...panels]
	}

	function clampGridCols() {
		gridCols = Math.min(4, Math.max(1, Math.round(gridCols)))
		for (const p of panels) {
			if (p.colSpan > gridCols) p.colSpan = gridCols
		}
		reflowPanelsPack()
	}

	function tryMoveOrSwap(p: Panel, nc: number, nr: number): boolean {
		if (nr + p.rowSpan > gridRows) gridRows = nr + p.rowSpan
		if (nc < 0 || nr < 0 || nc + p.colSpan > gridCols) return false

		const oc = p.col
		const or = p.row

		if (canPlace(nc, nr, p.colSpan, p.rowSpan, p.id)) {
			p.col = nc
			p.row = nr
			syncRowsFromPanels()
			panels = [...panels]
			return true
		}

		const blockers = panels.filter(
			(q) => q.id !== p.id && overlap(nc, nr, p.colSpan, p.rowSpan, q),
		)

		for (const q of blockers) {
			const ign = new Set([p.id, q.id])
			if (
				canPlaceIgnoring(nc, nr, p.colSpan, p.rowSpan, ign) &&
				canPlaceIgnoring(oc, or, q.colSpan, q.rowSpan, ign)
			) {
				p.col = nc
				p.row = nr
				q.col = oc
				q.row = or
				syncRowsFromPanels()
				panels = [...panels]
				return true
			}
		}

		if (blockers.length === 1) {
			const q = blockers[0]
			if (canPlaceIgnoring(oc, or, q.colSpan, q.rowSpan, new Set([p.id, q.id]))) {
				const qc = q.col
				const qr = q.row
				q.col = oc
				q.row = or
				if (canPlace(nc, nr, p.colSpan, p.rowSpan, p.id)) {
					p.col = nc
					p.row = nr
					syncRowsFromPanels()
					panels = [...panels]
					return true
				}
				q.col = qc
				q.row = qr
			}
		}

		const slot = growGridAndFindSlot(p.colSpan, p.rowSpan)
		if (slot) {
			p.col = slot.col
			p.row = slot.row
			syncRowsFromPanels()
			panels = [...panels]
			return true
		}
		return false
	}

	function hitPanelAt(inner: { x: number; y: number }): Panel | null {
		for (let i = panels.length - 1; i >= 0; i--) {
			const p = panels[i]
			const r = panelOuterRect(p, layout)
			if (
				inner.x >= r.x &&
				inner.x < r.x + r.w &&
				inner.y >= r.y &&
				inner.y < r.y + r.h
			) {
				return p
			}
		}
		return null
	}

	function onCanvasPointerDown(e: PointerEvent) {
		if (!canvasEl) return
		const inner = innerFromEvent(e)
		const p = hitPanelAt(inner)
		if (!p) {
			selectedId = null
			return
		}
		const r = panelOuterRect(p, layout)
		selectedId = p.id
		dragId = p.id
		grabDx = inner.x - r.x
		grabDy = inner.y - r.y
		dragInnerX = inner.x - grabDx
		dragInnerY = inner.y - grabDy
		canvasEl.setPointerCapture(e.pointerId)
		e.preventDefault()
	}

	function onCanvasPointerMove(e: PointerEvent) {
		if (dragId == null) return
		const inner = innerFromEvent(e)
		dragInnerX = inner.x - grabDx
		dragInnerY = inner.y - grabDy
	}

	function onCanvasPointerUp(e: PointerEvent) {
		if (dragId == null) return
		const p = panels.find((x) => x.id === dragId)
		if (p) {
			const ncol = snapCol(dragInnerX, p.colSpan, gridCols, layout)
			const nrow = snapRow(dragInnerY, p.rowSpan, gridRows, layout)
			if (ncol !== p.col || nrow !== p.row) tryMoveOrSwap(p, ncol, nrow)
		}
		dragId = null
		try {
			canvasEl?.releasePointerCapture(e.pointerId)
		} catch {
			/* ignore */
		}
	}

	function tryDeltaSpan(id: string, dCol: number, dRow: number) {
		const p = panels.find((x) => x.id === id)
		if (!p) return
		const ncs = Math.max(1, p.colSpan + dCol)
		const nrs = Math.max(1, p.rowSpan + dRow)
		if (ncs === p.colSpan && nrs === p.rowSpan) return
		if (canPlace(p.col, p.row, ncs, nrs, p.id)) {
			p.colSpan = ncs
			p.rowSpan = nrs
			panels = [...panels]
			syncRowsFromPanels()
		}
	}

	function canExpandW(p: Panel) {
		return canPlace(p.col, p.row, p.colSpan + 1, p.rowSpan, p.id)
	}
	function canShrinkW(p: Panel) {
		if (p.colSpan <= 1) return false
		return canPlace(p.col, p.row, p.colSpan - 1, p.rowSpan, p.id)
	}
	function canExpandH(p: Panel) {
		return canPlace(p.col, p.row, p.colSpan, p.rowSpan + 1, p.id)
	}
	function canShrinkH(p: Panel) {
		if (p.rowSpan <= 1) return false
		return canPlace(p.col, p.row, p.colSpan, p.rowSpan - 1, p.id)
	}

	function numStep(
		v: number,
		min: number,
		max: number,
		stepVal: number,
		delta: number,
	): number {
		const n = Math.round((v + delta * stepVal) / stepVal) * stepVal
		const rounded = Math.round(n * 1000) / 1000
		return Math.min(max, Math.max(min, rounded))
	}

	/** 叠加层：inner 坐标系中心点 + 尺寸，配合 translate(-50%,-50%) 居中 */
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

	async function exportPng() {
		if (!panels.length) {
			showMsg("请先添加图片")
			return
		}
		await loadAllImages()
		const Lm = computeGridTracks(gridCols, gridRows, panels, 0)
		const gMax = maxCellLongestEdge(Lm)
		const gap = Math.round(
			(gMax * Math.min(30, Math.max(0, cellGapPct))) / 100,
		)
		const pad = Math.round(
			(gMax * Math.min(30, Math.max(0, canvasPaddingPct))) / 100,
		)
		const pb = Math.round(
			(gMax * Math.min(30, Math.max(0, panelBorderPct))) / 100,
		)
		const pp = Math.round(
			(gMax * Math.min(30, Math.max(0, panelPaddingPct))) / 100,
		)
		const L = computeGridTracks(gridCols, gridRows, panels, gap)

		const cw = pad * 2 + L.innerW
		const ch = pad * 2 + L.innerH

		const dpr = Math.min(2, window.devicePixelRatio || 1)
		const out = exportOutputScale
		const canvas = document.createElement("canvas")
		canvas.width = Math.round(cw * out * dpr)
		canvas.height = Math.round(ch * out * dpr)
		const ctx = canvas.getContext("2d")
		if (!ctx) return
		ctx.setTransform(dpr * out, 0, 0, dpr * out, 0, 0)

		ctx.fillStyle = canvasBgColor
		ctx.fillRect(0, 0, cw, ch)

		ctx.save()
		ctx.translate(pad, pad)

		for (const p of panels) {
			const img = imgMap.get(p.id) ?? null
			drawPanel(ctx, p, L, img, pp, pb, panelBorderColor, 1)
		}
		ctx.restore()

		const a = document.createElement("a")
		a.download = `mangaga-${Date.now()}.png`
		a.href = canvas.toDataURL("image/png")
		a.click()
	}

	function onDocumentPointerDown(e: PointerEvent) {
		const el = e.target
		if (el instanceof Node && canvasEl?.contains(el)) return
		if (el instanceof Element && el.closest("[data-mg-selection-ui]")) return
		selectedId = null
	}

	onMount(() => {
		if (typeof document !== "undefined") {
			document.addEventListener("pointerdown", onDocumentPointerDown, true)
		}
		const el = previewWrapEl
		if (el && typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(() => {
				previewContainerW = el.clientWidth
			})
			ro.observe(el)
			previewContainerW = el.clientWidth
		}
	})

	onDestroy(() => {
		if (typeof document !== "undefined") {
			document.removeEventListener("pointerdown", onDocumentPointerDown, true)
		}
		ro?.disconnect()
		for (const p of panels) {
			URL.revokeObjectURL(p.src)
			imgMap.delete(p.id)
		}
	})
</script>

<div class="text-base-content mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 md:max-w-4xl md:gap-8 md:px-6">
	<header class="text-center">
		<h1 class="text-primary text-4xl font-bold tracking-tight md:text-5xl">Mangaga</h1>
		<p class="text-base-content/75 mt-2 text-base md:text-lg">
			A simple comic layout tool
		</p>
	</header>

	{#if message}
		<div class="alert alert-warning text-base shadow-md">{message}</div>
	{/if}

	<section class="card bg-base-100 border-base-300 border shadow-md">
		<div class="card-body gap-6 p-5 md:p-8">
			<div class="flex flex-wrap items-stretch gap-3">
				<label class="btn btn-primary btn-lg min-h-14 shrink-0 cursor-pointer px-6 text-lg font-medium">
					添加图片
					<input
						bind:this={fileInput}
						id="mangaga-files"
						type="file"
						accept="image/*"
						multiple
						class="sr-only"
						on:change={onPickFiles}
					/>
				</label>
				<button type="button" class="btn btn-ghost btn-lg text-error min-h-14 px-6 text-lg" on:click={clearAll}>
					清空
				</button>
			</div>

			<p class="text-base-content/70 text-sm leading-relaxed md:text-base">
				在画布上拖动图片；预览与导出使用同一套几何与 contain
				完整显示。选中后出现删除与箭头。
			</p>

			<div
				bind:this={previewWrapEl}
				class="bg-base-300/40 border-base-300 w-full max-w-full overflow-auto rounded-2xl border-2 p-2 md:p-3"
				style="max-height: min(75vh, 880px);"
			>
				<div
					class="relative mx-auto inline-block max-w-full"
					style="width: {displayW}px; min-width: min(100%, {displayW}px);"
				>
					<canvas
						bind:this={canvasEl}
						class="bg-base-100 block max-w-full touch-none"
						on:pointerdown={onCanvasPointerDown}
						on:pointermove={onCanvasPointerMove}
						on:pointerup={onCanvasPointerUp}
						on:pointercancel={onCanvasPointerUp}
					></canvas>

					{#if selectedId && !dragId}
						{@const sp = panels.find((x) => x.id === selectedId)}
						{#if sp}
							{@const r = panelOuterRect(sp, layout)}
							{@const del = overlayCenter(r.x + r.w / 2, r.y + r.h / 2, 40, 40)}
							<div class="pointer-events-none absolute inset-0 z-10" data-mg-selection-ui>
							<button
								type="button"
								data-remove
								class="btn btn-error btn-sm pointer-events-auto absolute min-h-10 min-w-10 rounded-full p-0 text-lg font-bold shadow-md"
								style="left: {del.left}px; top: {del.top}px; width: {del.width}px; height: {del.height}px; transform: translate(-50%, -50%);"
								aria-label="删除"
								on:click|stopPropagation={() => removePanel(sp.id)}
							>
								×
							</button>
							{#if canShrinkW(sp)}
								{@const b = overlayCenter(r.x + 20, r.y + r.h / 2, 40, 44)}
								<button
									type="button"
									class="btn btn-primary btn-sm pointer-events-auto absolute min-h-11 min-w-11 p-0 text-xl"
									style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
									aria-label="减宽"
									on:click|stopPropagation={() => tryDeltaSpan(sp.id, -1, 0)}
								>
									←
								</button>
							{/if}
							{#if canExpandW(sp)}
								{@const b = overlayCenter(r.x + r.w - 20, r.y + r.h / 2, 40, 44)}
								<button
									type="button"
									class="btn btn-primary btn-sm pointer-events-auto absolute min-h-11 min-w-11 p-0 text-xl"
									style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
									aria-label="加宽"
									on:click|stopPropagation={() => tryDeltaSpan(sp.id, 1, 0)}
								>
									→
								</button>
							{/if}
							{#if canShrinkH(sp)}
								{@const b = overlayCenter(r.x + r.w / 2, r.y + 22, 44, 40)}
								<button
									type="button"
									class="btn btn-primary btn-sm pointer-events-auto absolute min-h-10 min-w-12 p-0 text-xl"
									style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
									aria-label="减高"
									on:click|stopPropagation={() => tryDeltaSpan(sp.id, 0, -1)}
								>
									↑
								</button>
							{/if}
							{#if canExpandH(sp)}
								{@const b = overlayCenter(r.x + r.w / 2, r.y + r.h - 22, 44, 40)}
								<button
									type="button"
									class="btn btn-primary btn-sm pointer-events-auto absolute min-h-10 min-w-12 p-0 text-xl"
									style="left: {b.left}px; top: {b.top}px; width: {b.width}px; height: {b.height}px; transform: translate(-50%, -50%);"
									aria-label="加高"
									on:click|stopPropagation={() => tryDeltaSpan(sp.id, 0, 1)}
								>
									↓
								</button>
							{/if}
							</div>
						{/if}
					{/if}
				</div>
			</div>

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
								clampGridCols()
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
							on:change={clampGridCols}
						/>
						<button
							type="button"
							class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
							on:click={() => {
								gridCols = numStep(gridCols, 1, 4, 1, 1)
								clampGridCols()
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
					<span class="label-text text-sm font-medium md:text-base">
						全图外边距
					</span>
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
							on:click={() =>
								(canvasPaddingPct = numStep(canvasPaddingPct, 0, 30, pctStep, -1))}
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
							<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-[2.75rem] px-2 text-lg font-medium">%</span>
						</div>
						<button
							type="button"
							class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
							on:click={() =>
								(canvasPaddingPct = numStep(canvasPaddingPct, 0, 30, pctStep, 1))}
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
							<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-[2.75rem] px-2 text-lg font-medium">%</span>
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
							on:click={() =>
								(panelPaddingPct = numStep(panelPaddingPct, 0, 30, pctStep, -1))}
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
							<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-[2.75rem] px-2 text-lg font-medium">%</span>
						</div>
						<button
							type="button"
							class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
							on:click={() =>
								(panelPaddingPct = numStep(panelPaddingPct, 0, 30, pctStep, 1))}
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
							on:click={() =>
								(panelBorderPct = numStep(panelBorderPct, 0, 30, pctStep, -1))}
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
							<span class="btn btn-outline join-item border-base-300 text-base-content/80 pointer-events-none min-h-14 min-w-[2.75rem] px-2 text-lg font-medium">%</span>
						</div>
						<button
							type="button"
							class="btn btn-lg min-h-14 min-w-14 shrink-0 text-xl"
							on:click={() =>
								(panelBorderPct = numStep(panelBorderPct, 0, 30, pctStep, 1))}
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
					<span class="label-text text-sm font-medium md:text-base">
						导出缩放（约 {exportPixelW} × {exportPixelH} px）
					</span>
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
						<button type="button" class="btn btn-primary btn-lg min-h-12 px-6 text-lg" on:click={exportPng}>
							导出 PNG
						</button>
					</div>
					<p class="text-base-content/60 text-sm">
						逻辑尺寸 {Math.round(designOuterW)} × {Math.round(designOuterH)} px；基准边长 {Math.round(globalMaxEdge)} px
					</p>
				</div>
			</div>
		</div>
	</section>
</div>
