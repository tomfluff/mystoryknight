/*
 * Per-language display-font loading. Titan One + Nunito (Latin) ship with the
 * entry view; the non-Latin companions are heavy (M PLUS Rounded's CJK
 * unicode-range set alone is ~450KB of @font-face CSS), so each loads as a
 * lazy chunk only when its language is active.
 */
const loaded = new Set<string>();

export async function loadLanguageFonts(language: string): Promise<void> {
  if (loaded.has(language)) return;
  if (language === "he") {
    await Promise.all([
      import("@fontsource/heebo/400.css"),
      import("@fontsource/heebo/700.css"),
      import("@fontsource/heebo/800.css"),
    ]);
  } else if (language === "ja") {
    await Promise.all([
      import("@fontsource/m-plus-rounded-1c/400.css"),
      import("@fontsource/m-plus-rounded-1c/700.css"),
      import("@fontsource/m-plus-rounded-1c/800.css"),
    ]);
  }
  // Marked only after success so a failed chunk import can retry next call.
  loaded.add(language);
}
