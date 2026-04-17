export type MangagaLocale = "zh" | "en"

export type MangagaI18n = {
	subtitle: string
	switchLanguage: string
	reorderModeLabel: string
	reorderModeHintOn: string
	reorderModeHintOff: string
	reorderModeOn: string
	reorderModeOff: string
	addImages: string
	clearAll: string
	touchHint: string
	panelStyleAndExport: string
	gridCols: string
	canvasBgColor: string
	canvasPadding: string
	cellGap: string
	panelPadding: string
	panelBorder: string
	panelBorderColor: string
	exportPng: string
	delete: string
	shrinkWidth: string
	expandWidth: string
	shrinkHeight: string
	expandHeight: string
	pleaseAddImages: string
	cannotReadImage: string
	cannotPlaceInGrid: string
	approxPx: (px: number) => string
	exportScaleLabel: (w: number, h: number) => string
	logicSizeLabel: (w: number, h: number, edge: number) => string
}

export const MANGAGA_I18N: Record<MangagaLocale, MangagaI18n> = {
	zh: {
		subtitle: "一个简单的漫画拼图工具",
		switchLanguage: "English",
		reorderModeLabel: "排序模式",
		reorderModeHintOn: "开",
		reorderModeHintOff: "关",
		reorderModeOn: "开启排序模式",
		reorderModeOff: "关闭排序模式",
		addImages: "添加图片",
		clearAll: "清空",
		touchHint:
			"移动端：未选中短按选中；选中后长按可拖动。也可开启“排序模式”直接拖动。",
		panelStyleAndExport: "样式与导出",
		gridCols: "列数 (1-4)",
		canvasBgColor: "全图背景色",
		canvasPadding: "全图外边距",
		cellGap: "格间距",
		panelPadding: "图片内边距",
		panelBorder: "单格描边",
		panelBorderColor: "单格描边颜色",
		exportPng: "导出 PNG",
		delete: "删除",
		shrinkWidth: "减宽",
		expandWidth: "加宽",
		shrinkHeight: "减高",
		expandHeight: "加高",
		pleaseAddImages: "请先添加图片",
		cannotReadImage: "无法读取图片，请换一张试试",
		cannotPlaceInGrid: "无法放入网格",
		approxPx: (px) => `约 ${px} px`,
		exportScaleLabel: (w, h) => `导出缩放（约 ${w} × ${h} px）`,
		logicSizeLabel: (w, h, edge) => `逻辑尺寸 ${w} × ${h} px；基准边长 ${edge} px`,
	},
	en: {
		subtitle: "A simple comic layout tool",
		switchLanguage: "中文",
		reorderModeLabel: "Reorder Mode",
		reorderModeHintOn: "ON",
		reorderModeHintOff: "OFF",
		reorderModeOn: "Enable Reorder Mode",
		reorderModeOff: "Disable Reorder Mode",
		addImages: "Add Images",
		clearAll: "Clear",
		touchHint:
			"Mobile: tap to select when none selected; long-press selected image to drag. You can also enable Reorder Mode for direct drag.",
		panelStyleAndExport: "Style & Export",
		gridCols: "Columns (1-4)",
		canvasBgColor: "Canvas Background",
		canvasPadding: "Canvas Padding",
		cellGap: "Cell Gap",
		panelPadding: "Image Padding",
		panelBorder: "Panel Border",
		panelBorderColor: "Panel Border Color",
		exportPng: "Export PNG",
		delete: "Delete",
		shrinkWidth: "Narrow",
		expandWidth: "Widen",
		shrinkHeight: "Shorten",
		expandHeight: "Heighten",
		pleaseAddImages: "Please add images first",
		cannotReadImage: "Cannot read this image. Please try another one.",
		cannotPlaceInGrid: "Cannot place image in grid",
		approxPx: (px) => `about ${px} px`,
		exportScaleLabel: (w, h) => `Export Scale (about ${w} × ${h} px)`,
		logicSizeLabel: (w, h, edge) => `Logical size ${w} × ${h} px; base edge ${edge} px`,
	},
}

export function detectInitialLocale(): MangagaLocale {
	if (typeof navigator === "undefined") return "zh"
	const lang = (navigator.language || "").toLowerCase()
	return lang.startsWith("zh") ? "zh" : "en"
}
