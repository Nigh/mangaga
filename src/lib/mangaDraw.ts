import type { GridLayout } from "./mangaLayout"
import { panelOuterRect } from "./mangaLayout"
import type { PanelLike } from "./mangaLayout"

/** contain：完整显示图片，不裁切；内边距 + 描边宽度均从内容区扣除，避免描边压到图 */
export function drawImageContain(
	ctx: CanvasRenderingContext2D,
	img: CanvasImageSource,
	ox: number,
	oy: number,
	ow: number,
	oh: number,
	panelPadding: number,
	borderReserve: number,
): void {
	const inset = panelPadding + borderReserve
	const ix = ox + inset
	const iy = oy + inset
	const iw = ow - inset * 2
	const ih = oh - inset * 2
	if (iw <= 0 || ih <= 0) return

	const el = img as HTMLImageElement
	const nw = el.naturalWidth || el.width
	const nh = el.naturalHeight || el.height
	if (nw <= 0 || nh <= 0) return

	const sc = Math.min(iw / nw, ih / nh)
	const dw = nw * sc
	const dh = nh * sc
	const dx = ix + (iw - dw) / 2
	const dy = iy + (ih - dh) / 2
	ctx.drawImage(img, dx, dy, dw, dh)
}

export function drawPanelInRect(
	ctx: CanvasRenderingContext2D,
	r: { x: number; y: number; w: number; h: number },
	img: CanvasImageSource | null,
	panelPadding: number,
	panelBorderWidth: number,
	panelBorderColor: string,
	alpha = 1,
): void {
	ctx.save()
	ctx.globalAlpha = alpha
	const bw = panelBorderWidth
	if (img && (img as HTMLImageElement).complete && ((img as HTMLImageElement).naturalWidth || 0) > 0) {
		drawImageContain(ctx, img, r.x, r.y, r.w, r.h, panelPadding, bw)
	}
	if (bw > 0) {
		ctx.strokeStyle = panelBorderColor
		ctx.lineWidth = bw
		ctx.strokeRect(
			r.x + bw / 2,
			r.y + bw / 2,
			r.w - bw,
			r.h - bw,
		)
	}
	ctx.restore()
}

export function drawPanel(
	ctx: CanvasRenderingContext2D,
	p: PanelLike,
	layout: GridLayout,
	img: CanvasImageSource | null,
	panelPadding: number,
	panelBorderWidth: number,
	panelBorderColor: string,
	alpha = 1,
): void {
	const r = panelOuterRect(p, layout)
	drawPanelInRect(ctx, r, img, panelPadding, panelBorderWidth, panelBorderColor, alpha)
}
