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
	import {
		MANGAGA_I18N,
		detectInitialLocale,
		type MangagaLocale,
	} from "../lib/mangagaI18n"
	import type { MangaPanel as Panel } from "../lib/mangagaTypes"
	import ComicCanvasStage from "./comic/ComicCanvasStage.svelte"
	import ComicSelectionOverlay from "./comic/ComicSelectionOverlay.svelte"
	import ComicStyleControls from "./comic/ComicStyleControls.svelte"

	let gridCols = 2
	let gridRows = 2
	const defaultEmptyRows = 2

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

	const touchLongPressMs = 360
	const touchMoveTolerancePx = 18
	const overlayTouchGuardMs = 320
	let touchDragMode = false
	let touchHoldDragCandidate = false
	let reorderMode = false
	let overlayControlsEnabled = true
	let overlayTouchGuardTimer: ReturnType<typeof setTimeout> | null = null
	let reorderJiggleRaf = 0
	let locale: MangagaLocale = "zh"
	let touchLongPressTimer: ReturnType<typeof setTimeout> | null = null
	let pendingTouchGesture: {
		pointerId: number
		targetPanelId: string | null
		selectedAtDown: string | null
		startClientX: number
		startClientY: number
		grabDx: number
		grabDy: number
		longPressTriggered: boolean
	} | null = null

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
	$: selectedPanel = selectedId ? panels.find((x) => x.id === selectedId) ?? null : null
	$: selectedCanShrinkW = selectedPanel ? canShrinkW(selectedPanel) : false
	$: selectedCanExpandW = selectedPanel ? canExpandW(selectedPanel) : false
	$: selectedCanShrinkH = selectedPanel ? canShrinkH(selectedPanel) : false
	$: selectedCanExpandH = selectedPanel ? canExpandH(selectedPanel) : false
	$: t = MANGAGA_I18N[locale]

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
		const usedRows = panels.reduce((m, p) => Math.max(m, p.row + p.rowSpan), 0)
		const minRows = panels.length ? 1 : defaultEmptyRows
		gridRows = Math.max(minRows, usedRows)
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

	function drawPreview(nowMs = 0) {
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

		const tSec =
			nowMs > 0
				? nowMs / 1000
				: typeof performance !== "undefined"
					? performance.now() / 1000
					: Date.now() / 1000
		for (const p of panels) {
			const img = imgMap.get(p.id) ?? null
			const r = panelOuterRect(p, layout)
			if (dragId === p.id) {
				drawPanel(ctx, p, layout, img, panelPadPx, borderPx, panelBorderColor, 0.2)
				const rr = { x: dragInnerX, y: dragInnerY, w: r.w, h: r.h }
				drawPanelInRect(ctx, rr, img, panelPadPx, borderPx, panelBorderColor, 1)
			} else if (reorderMode) {
				const jm = panelJiggleMotion(p.id)
				const angle = Math.sin(tSec * jm.angleFreq + jm.anglePhase) * 0.0065
				const dx = Math.sin(tSec * jm.xFreq + jm.xPhase) * (0.75 / previewScale) * jm.xSign
				const dy = Math.cos(tSec * jm.yFreq + jm.yPhase) * (0.5 / previewScale) * jm.ySign
				ctx.save()
				ctx.translate(r.x + r.w / 2 + dx, r.y + r.h / 2 + dy)
				ctx.rotate(angle)
				drawPanelInRect(
					ctx,
					{ x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h },
					img,
					panelPadPx,
					borderPx,
					panelBorderColor,
					1,
				)
				ctx.restore()
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

	function stopReorderJiggleLoop() {
		if (!reorderJiggleRaf || typeof window === "undefined") return
		window.cancelAnimationFrame(reorderJiggleRaf)
		reorderJiggleRaf = 0
	}

	function runReorderJiggleLoop(nowMs: number) {
		if (!reorderMode || typeof window === "undefined") {
			reorderJiggleRaf = 0
			return
		}
		drawPreview(nowMs)
		reorderJiggleRaf = window.requestAnimationFrame(runReorderJiggleLoop)
	}

	function ensureReorderJiggleLoop() {
		if (!reorderMode || reorderJiggleRaf || typeof window === "undefined") return
		reorderJiggleRaf = window.requestAnimationFrame(runReorderJiggleLoop)
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
	$: {
		reorderMode
		if (reorderMode) ensureReorderJiggleLoop()
		else stopReorderJiggleLoop()
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
				showMsg(t.cannotReadImage)
				continue
			}
			let slot = findFreeSlot(1, 1)
			if (!slot) slot = growGridAndFindSlot(1, 1)
			if (!slot) {
				URL.revokeObjectURL(src)
				showMsg(t.cannotPlaceInGrid)
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
		gridRows = defaultEmptyRows
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

	function clearTouchLongPressTimer() {
		if (!touchLongPressTimer) return
		clearTimeout(touchLongPressTimer)
		touchLongPressTimer = null
	}

	function clearOverlayTouchGuardTimer() {
		if (!overlayTouchGuardTimer) return
		clearTimeout(overlayTouchGuardTimer)
		overlayTouchGuardTimer = null
	}

	function armOverlayTouchGuard() {
		overlayControlsEnabled = false
		clearOverlayTouchGuardTimer()
		overlayTouchGuardTimer = setTimeout(() => {
			overlayControlsEnabled = true
			overlayTouchGuardTimer = null
		}, overlayTouchGuardMs)
	}

	function panelJiggleSeed(id: string): number {
		let h = 0
		for (let i = 0; i < id.length; i++) {
			h = (h << 5) - h + id.charCodeAt(i)
			h |= 0
		}
		return Math.abs(h % 997) / 997
	}

function panelJiggleMotion(id: string) {
	const s1 = panelJiggleSeed(id)
	const s2 = panelJiggleSeed(`${id}:x`)
	const s3 = panelJiggleSeed(`${id}:y`)
	const s4 = panelJiggleSeed(`${id}:r`)
	return {
		angleFreq: 6.5 + s1 * 4.5,
		xFreq: 8.5 + s2 * 5.5,
		yFreq: 7.2 + s3 * 5.3,
		anglePhase: s2 * Math.PI * 2,
		xPhase: s3 * Math.PI * 2,
		yPhase: s4 * Math.PI * 2,
		xSign: s1 > 0.5 ? 1 : -1,
		ySign: s2 > 0.5 ? 1 : -1,
	}
}

	function clearPendingTouchGesture() {
		clearTouchLongPressTimer()
		pendingTouchGesture = null
		touchHoldDragCandidate = false
	}

	function beginDrag(pointerId: number, panel: Panel, inner: { x: number; y: number }) {
		const r = panelOuterRect(panel, layout)
		dragId = panel.id
		grabDx = inner.x - r.x
		grabDy = inner.y - r.y
		dragInnerX = inner.x - grabDx
		dragInnerY = inner.y - grabDy
		canvasEl.setPointerCapture(pointerId)
	}

	function onCanvasPointerDown(e: PointerEvent) {
		if (!canvasEl) return
		const inner = innerFromEvent(e)
		const p = hitPanelAt(inner)

		if (reorderMode && e.pointerType === "touch") {
			clearPendingTouchGesture()
			if (!p) {
				selectedId = null
				return
			}
			selectedId = p.id
			beginDrag(e.pointerId, p, inner)
			touchDragMode = true
			e.preventDefault()
			return
		}

		if (e.pointerType === "touch") {
			clearPendingTouchGesture()
			const r = p ? panelOuterRect(p, layout) : null
			touchHoldDragCandidate = !!(selectedId && p && p.id === selectedId)
			pendingTouchGesture = {
				pointerId: e.pointerId,
				targetPanelId: p?.id ?? null,
				selectedAtDown: selectedId,
				startClientX: e.clientX,
				startClientY: e.clientY,
				grabDx: r ? inner.x - r.x : 0,
				grabDy: r ? inner.y - r.y : 0,
				longPressTriggered: false,
			}
			touchLongPressTimer = setTimeout(() => {
				if (!pendingTouchGesture || pendingTouchGesture.pointerId !== e.pointerId) return
				pendingTouchGesture.longPressTriggered = true

				if (pendingTouchGesture.selectedAtDown == null) {
					selectedId = null
					armOverlayTouchGuard()
					return
				}

				if (pendingTouchGesture.targetPanelId !== pendingTouchGesture.selectedAtDown) {
					return
				}

				const panel = panels.find((x) => x.id === pendingTouchGesture?.targetPanelId)
				if (!panel) {
					clearPendingTouchGesture()
					return
				}

				touchDragMode = true
				dragId = panel.id
				grabDx = pendingTouchGesture.grabDx
				grabDy = pendingTouchGesture.grabDy
				const rr = panelOuterRect(panel, layout)
				dragInnerX = rr.x
				dragInnerY = rr.y
				canvasEl.setPointerCapture(e.pointerId)
				clearPendingTouchGesture()
			}, touchLongPressMs)
			return
		}
		if (!p) {
			selectedId = null
			return
		}
		selectedId = p.id
		beginDrag(e.pointerId, p, inner)
		e.preventDefault()
	}

	function onCanvasPointerMove(e: PointerEvent) {
		if (pendingTouchGesture && pendingTouchGesture.pointerId === e.pointerId && !dragId) {
			const dx = e.clientX - pendingTouchGesture.startClientX
			const dy = e.clientY - pendingTouchGesture.startClientY
			const dist = Math.hypot(dx, dy)
			if (dist > touchMoveTolerancePx && !pendingTouchGesture.longPressTriggered) {
				clearPendingTouchGesture()
			}
		}
		if (dragId == null) return
		const inner = innerFromEvent(e)
		dragInnerX = inner.x - grabDx
		dragInnerY = inner.y - grabDy
		if (e.pointerType === "touch") {
			e.preventDefault()
		}
	}

	function onCanvasPointerUp(e: PointerEvent) {
		const pending = pendingTouchGesture
		if (pending && pending.pointerId === e.pointerId) {
			clearPendingTouchGesture()
			if (!pending.longPressTriggered) {
				const dx = e.clientX - pending.startClientX
				const dy = e.clientY - pending.startClientY
				const moved = Math.hypot(dx, dy) > touchMoveTolerancePx
				if (!moved) {
					const targetPanelId = pending.targetPanelId
					if (pending.selectedAtDown == null) {
						if (targetPanelId) {
							selectedId = targetPanelId
							armOverlayTouchGuard()
						} else {
							selectedId = null
						}
					} else if (targetPanelId && targetPanelId !== pending.selectedAtDown) {
						selectedId = targetPanelId
						armOverlayTouchGuard()
					} else {
						selectedId = null
						armOverlayTouchGuard()
					}
				}
			}
		}

		if (dragId == null) return
		const p = panels.find((x) => x.id === dragId)
		if (p) {
			const ncol = snapCol(dragInnerX, p.colSpan, gridCols, layout)
			const nrow = snapRow(dragInnerY, p.rowSpan, gridRows, layout)
			if (ncol !== p.col || nrow !== p.row) tryMoveOrSwap(p, ncol, nrow)
		}
		dragId = null
		touchDragMode = false
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
		if (dRow > 0 && p.row + nrs > gridRows) {
			// 当底部没有空白行时，允许最底行向下扩展并补一行。
			const maxUsedRow = panels.reduce((m, x) => Math.max(m, x.row + x.rowSpan), 0)
			const hasBottomBlankRows = gridRows > maxUsedRow
			const isPanelAtBottom = p.row + p.rowSpan >= gridRows
			if (!hasBottomBlankRows && isPanelAtBottom) {
				gridRows = p.row + nrs
			}
		}
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
		if (canPlace(p.col, p.row, p.colSpan, p.rowSpan + 1, p.id)) return true
		const maxUsedRow = panels.reduce((m, x) => Math.max(m, x.row + x.rowSpan), 0)
		const hasBottomBlankRows = gridRows > maxUsedRow
		const isPanelAtBottom = p.row + p.rowSpan >= gridRows
		return !hasBottomBlankRows && isPanelAtBottom
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

	function onSelectedDeltaSpan(dCol: number, dRow: number) {
		if (!selectedId) return
		tryDeltaSpan(selectedId, dCol, dRow)
	}

	function setReorderMode(next: boolean) {
		reorderMode = next
		if (!reorderMode) {
			stopReorderJiggleLoop()
			touchDragMode = false
			touchHoldDragCandidate = false
			drawPreview()
		}
	}

	function onReorderModeChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement | null
		setReorderMode(Boolean(input?.checked))
	}

	async function exportPng() {
		if (!panels.length) {
			showMsg(t.pleaseAddImages)
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
		locale = detectInitialLocale()
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
		clearPendingTouchGesture()
		clearOverlayTouchGuardTimer()
		stopReorderJiggleLoop()
		ro?.disconnect()
		for (const p of panels) {
			URL.revokeObjectURL(p.src)
			imgMap.delete(p.id)
		}
	})
</script>

<div class="text-base-content mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-8 md:max-w-4xl md:gap-8 md:px-6">
	<header class="text-center">
		<div class="mb-3 flex flex-wrap justify-end gap-2">
			<button
				type="button"
				class="btn btn-sm btn-outline"
				on:click={() => {
					locale = locale === "zh" ? "en" : "zh"
				}}
			>
				{t.switchLanguage}
			</button>
		</div>
		<h1 class="text-primary text-4xl font-bold tracking-tight md:text-5xl">Mangaga</h1>
		<p class="text-base-content/75 mt-2 text-base md:text-lg">{t.subtitle}</p>
	</header>

	{#if message}
		<div class="alert alert-warning text-base shadow-md">{message}</div>
	{/if}

	<section class="card bg-base-100 border-base-300 border shadow-md">
		<div class="card-body gap-6 p-5 md:p-8">
			<div class="flex flex-wrap items-stretch gap-3">
				<label class="btn btn-primary btn-lg min-h-14 shrink-0 cursor-pointer px-6 text-lg font-medium">
					{t.addImages}
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
					{t.clearAll}
				</button>
			</div>

			<p class="text-base-content/70 text-sm leading-relaxed md:text-base">{t.touchHint}</p>
			<div class="bg-base-200/70 border-base-300 flex items-center justify-between rounded-xl border px-3 py-2 md:px-4">
				<div class="text-sm font-medium md:text-base">{t.reorderModeLabel}</div>
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold uppercase">{reorderMode ? t.reorderModeHintOn : t.reorderModeHintOff}</span>
					<input
						type="checkbox"
						class="toggle toggle-primary toggle-lg"
						bind:checked={reorderMode}
						on:change={onReorderModeChange}
					/>
				</div>
			</div>

			<ComicCanvasStage
				bind:previewWrapEl
				bind:canvasEl
				{displayW}
				useTouchDragMode={reorderMode || touchDragMode || dragId != null || touchHoldDragCandidate}
				{onCanvasPointerDown}
				{onCanvasPointerMove}
				{onCanvasPointerUp}
			>
				{#if selectedPanel && !dragId && !reorderMode}
					<ComicSelectionOverlay
						layout={layout}
						{previewScale}
						{canvasPadPx}
						selectedPanel={selectedPanel}
						canShrinkW={selectedCanShrinkW}
						canExpandW={selectedCanExpandW}
						canShrinkH={selectedCanShrinkH}
						canExpandH={selectedCanExpandH}
						controlsEnabled={overlayControlsEnabled}
						labels={t}
						onRemove={() => removePanel(selectedPanel.id)}
						onDeltaSpan={onSelectedDeltaSpan}
					/>
				{/if}
			</ComicCanvasStage>

			<ComicStyleControls
				bind:gridCols
				bind:canvasBgColor
				bind:canvasPaddingPct
				bind:cellGapPct
				bind:panelPaddingPct
				bind:panelBorderPct
				bind:panelBorderColor
				bind:exportOutputScale
				{pctStep}
				{gapPx}
				{canvasPadPx}
				{panelPadPx}
				{borderPx}
				{exportPixelW}
				{exportPixelH}
				{designOuterW}
				{designOuterH}
				{globalMaxEdge}
				{numStep}
				labels={t}
				onClampGridCols={clampGridCols}
				onExportPng={exportPng}
			/>
		</div>
	</section>
</div>
