/** 百分比调节步长：单步对应像素变化 ≤3px，最低 0.1%；最长边 >2000px 时用 0.1% */
export function percentStepForMaxEdge(globalMaxEdge: number): number {
	if (!Number.isFinite(globalMaxEdge) || globalMaxEdge <= 0) return 0.1
	if (globalMaxEdge > 2000) return 0.1
	const from3px = (300 / globalMaxEdge) * 1
	return Math.max(0.1, Math.min(0.5, Math.round(from3px * 1000) / 1000))
}
