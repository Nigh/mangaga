/** 漫画拼贴：非等宽列 / 非等高行网格，与 Canvas 导出共用几何 */

export type PanelLike = {
	id: string
	col: number
	row: number
	colSpan: number
	rowSpan: number
	nw: number
	nh: number
}

export type GridLayout = {
	colWidths: number[]
	rowHeights: number[]
	gap: number
	innerW: number
	innerH: number
}

function colOccupied(c: number, panels: PanelLike[], gridCols: number): boolean {
	if (c < 0 || c >= gridCols) return false
	return panels.some((p) => p.col <= c && c < p.col + p.colSpan)
}

function rowOccupied(r: number, panels: PanelLike[], gridRows: number): boolean {
	if (r < 0 || r >= gridRows) return false
	return panels.some((p) => p.row <= r && r < p.row + p.rowSpan)
}

/** 无内容的列继承左侧列宽；第 0 列空则继承右侧第一个有图列 */
function fillEmptyColumnWidths(
	colWidths: number[],
	gridCols: number,
	panels: PanelLike[],
	emptyMinTrack: number,
) {
	for (let c = 0; c < gridCols; c++) {
		if (colOccupied(c, panels, gridCols)) continue
		let inherit = emptyMinTrack
		if (c > 0) inherit = Math.max(inherit, colWidths[c - 1])
		else {
			for (let k = 1; k < gridCols; k++) {
				if (colOccupied(k, panels, gridCols)) {
					inherit = Math.max(inherit, colWidths[k])
					break
				}
			}
		}
		colWidths[c] = Math.max(colWidths[c], inherit)
	}
}

function fillEmptyRowHeights(
	rowHeights: number[],
	gridRows: number,
	panels: PanelLike[],
	emptyMinTrack: number,
) {
	for (let r = 0; r < gridRows; r++) {
		if (rowOccupied(r, panels, gridRows)) continue
		let inherit = emptyMinTrack
		if (r > 0) inherit = Math.max(inherit, rowHeights[r - 1])
		else {
			for (let k = 1; k < gridRows; k++) {
				if (rowOccupied(k, panels, gridRows)) {
					inherit = Math.max(inherit, rowHeights[k])
					break
				}
			}
		}
		rowHeights[r] = Math.max(rowHeights[r], inherit)
	}
}

/** 列宽 / 行高由图中需求决定；空列 / 空行继承邻近轨道 */
export function computeGridTracks(
	gridCols: number,
	gridRows: number,
	panels: PanelLike[],
	gap: number,
	emptyMinTrack = 96,
): GridLayout {
	const colWidths = Array.from({ length: gridCols }, () =>
		panels.length ? 1 : emptyMinTrack,
	)
	const rowHeights = Array.from({ length: gridRows }, () =>
		panels.length ? 1 : emptyMinTrack,
	)

	for (const p of panels) {
		const nw = Math.max(1, p.nw)
		const nh = Math.max(1, p.nh)
		const perCol = Math.ceil(nw / Math.max(1, p.colSpan))
		const perRow = Math.ceil(nh / Math.max(1, p.rowSpan))
		for (let c = p.col; c < p.col + p.colSpan && c < gridCols; c++) {
			colWidths[c] = Math.max(colWidths[c], perCol)
		}
		for (let r = p.row; r < p.row + p.rowSpan && r < gridRows; r++) {
			rowHeights[r] = Math.max(rowHeights[r], perRow)
		}
	}

	fillEmptyColumnWidths(colWidths, gridCols, panels, emptyMinTrack)
	fillEmptyRowHeights(rowHeights, gridRows, panels, emptyMinTrack)

	let innerW = 0
	for (let c = 0; c < gridCols; c++) {
		innerW += colWidths[c]
		if (c < gridCols - 1) innerW += gap
	}
	let innerH = 0
	for (let r = 0; r < gridRows; r++) {
		innerH += rowHeights[r]
		if (r < gridRows - 1) innerH += gap
	}

	return { colWidths, rowHeights, gap, innerW, innerH }
}

/** 每个格点 (c,r) 取 max(列宽,行高)，再对所有格点取全局最大，作百分比基准 */
export function maxCellLongestEdge(layout: GridLayout): number {
	let m = 1
	for (let c = 0; c < layout.colWidths.length; c++) {
		for (let r = 0; r < layout.rowHeights.length; r++) {
			const edge = Math.max(layout.colWidths[c], layout.rowHeights[r])
			m = Math.max(m, edge)
		}
	}
	return m
}

export function colLeft(layout: GridLayout, col: number): number {
	let x = 0
	for (let c = 0; c < col; c++) {
		x += layout.colWidths[c] + layout.gap
	}
	return x
}

export function rowTop(layout: GridLayout, row: number): number {
	let y = 0
	for (let r = 0; r < row; r++) {
		y += layout.rowHeights[r] + layout.gap
	}
	return y
}

/** 面板外框（内层坐标系原点 = 网格左上角） */
export function panelOuterRect(
	p: PanelLike,
	layout: GridLayout,
): { x: number; y: number; w: number; h: number } {
	const x = colLeft(layout, p.col)
	const y = rowTop(layout, p.row)
	let w = 0
	for (let c = p.col; c < p.col + p.colSpan; c++) {
		w += layout.colWidths[c]
	}
	w += (p.colSpan - 1) * layout.gap
	let h = 0
	for (let r = p.row; r < p.row + p.rowSpan; r++) {
		h += layout.rowHeights[r]
	}
	h += (p.rowSpan - 1) * layout.gap
	return { x, y, w, h }
}

/** 将内层 x 对齐到某一列起点（用于拖动落格） */
export function snapCol(
	innerX: number,
	colSpan: number,
	gridCols: number,
	layout: GridLayout,
): number {
	let best = 0
	let bestD = Infinity
	for (let c = 0; c <= gridCols - colSpan; c++) {
		const x0 = colLeft(layout, c)
		const d = Math.abs(innerX - x0)
		if (d < bestD) {
			bestD = d
			best = c
		}
	}
	return best
}

export function snapRow(
	innerY: number,
	rowSpan: number,
	gridRows: number,
	layout: GridLayout,
): number {
	let best = 0
	let bestD = Infinity
	for (let r = 0; r <= gridRows - rowSpan; r++) {
		const y0 = rowTop(layout, r)
		const d = Math.abs(innerY - y0)
		if (d < bestD) {
			bestD = d
			best = r
		}
	}
	return best
}
