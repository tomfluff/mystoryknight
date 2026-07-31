import { useEffect } from "react";
import { useDirection } from "@mantine/core";
import { usePreferencesStore } from "../stores/preferencesStore";
import { loadLanguageFonts } from "../i18n/fonts";

const RTL_LANGUAGES = ["he"];

// Keeps <html lang>, text direction (both the DOM `dir` attribute and
// Mantine's DirectionProvider) and the language's display fonts in sync with
// the selected story language. Runs on initial load (persisted preference)
// and on every change.
export function useLanguageDirection() {
  const language = usePreferencesStore.use.language();
  const { setDirection } = useDirection();

  useEffect(() => {
    document.documentElement.lang = language;
    setDirection(RTL_LANGUAGES.includes(language) ? "rtl" : "ltr");
    // Fire-and-forget: text renders in the fallback stack until the lazy
    // font chunk lands, then reflows once.
    void loadLanguageFonts(language);
    // setDirection is not referentially stable; depending on it is safe
    // because it only triggers a re-render when the direction changes.
  }, [language, setDirection]);
}
