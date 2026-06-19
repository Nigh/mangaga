import { writable } from "svelte/store"
import { detectInitialLocale, type MangagaLocale } from "../mangagaI18n"

export const locale = writable<MangagaLocale>("zh")

export function initLocale() {
	locale.set(detectInitialLocale())
}

export function toggleLocale() {
	locale.update((l) => (l === "zh" ? "en" : "zh"))
}
