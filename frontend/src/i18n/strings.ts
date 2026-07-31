import { usePreferencesStore } from "../stores/preferencesStore";

/*
 * Static translations for UI chrome. Story content (parts, premises,
 * characters, actions) is LLM-generated in English and translated at runtime
 * via useTranslation -- only fixed UI labels belong here.
 */

type TUiLanguage = "en" | "he" | "ja" | "es";

const strings = {
  loading: {
    en: "Loading...",
    he: "טוען...",
    ja: "読み込み中...",
    es: "Cargando...",
  },
  startAdventure: {
    en: "Start Adventure",
    he: "צאו להרפתקה",
    ja: "ぼうけんをはじめる",
    es: "Empezar la aventura",
  },
  showMore: {
    en: "Show more",
    he: "הצג עוד",
    ja: "もっと見る",
    es: "Ver más",
  },
  hide: {
    en: "Hide",
    he: "הסתר",
    ja: "とじる",
    es: "Ocultar",
  },
  storyEnded: {
    en: "The story has ended",
    he: "הסיפור הסתיים",
    ja: "おはなしはおしまい",
    es: "El cuento ha terminado",
  },
  choicesFailed: {
    en: "Choices did not load. Try again",
    he: "הבחירות לא נטענו. נסו שוב",
    ja: "せんたくしがよみこめませんでした。もういちど",
    es: "Las opciones no cargaron. Inténtalo otra vez",
  },
  actionFailed: {
    en: "That did not work. Pick again.",
    he: "זה לא עבד. בחרו שוב.",
    ja: "うまくいきませんでした。もういちどえらんでね。",
    es: "Eso no funcionó. Elige otra vez.",
  },
  storyLanguage: {
    en: "Story Language",
    he: "שפת הסיפור",
    ja: "ストーリーの言語",
    es: "Idioma del cuento",
  },
  storyLanguageDesc: {
    en: "Select the language of the story.",
    he: "בחרו את שפת הסיפור.",
    ja: "ストーリーの言語を選んでください。",
    es: "Elige el idioma del cuento.",
  },
  autoRead: {
    en: "Auto-read",
    he: "הקראה אוטומטית",
    ja: "自動読み上げ",
    es: "Lectura automática",
  },
  autoReadDesc: {
    en: "Automatically read the story sections.",
    he: "הקראת קטעי הסיפור באופן אוטומטי.",
    ja: "ストーリーを自動で読み上げます。",
    es: "Lee las partes del cuento automáticamente.",
  },
  storyImages: {
    en: "Story Images",
    he: "איורים לסיפור",
    ja: "ストーリーの絵",
    es: "Imágenes del cuento",
  },
  storyImagesDesc: {
    en: "Include images in the story.",
    he: "הוספת איורים לסיפור.",
    ja: "ストーリーに絵をつけます。",
    es: "Incluye imágenes en el cuento.",
  },
  storyComplexity: {
    en: "Story Complexity",
    he: "רמת הסיפור",
    ja: "ストーリーの難しさ",
    es: "Dificultad del cuento",
  },
  complexityEasy: {
    en: "Easy",
    he: "קל",
    ja: "やさしい",
    es: "Fácil",
  },
  complexityMedium: {
    en: "Medium",
    he: "בינוני",
    ja: "ふつう",
    es: "Medio",
  },
  complexityHard: {
    en: "Hard",
    he: "קשה",
    ja: "むずかしい",
    es: "Difícil",
  },
  complexityExpert: {
    en: "Expert",
    he: "מומחה",
    ja: "エキスパート",
    es: "Experto",
  },
  moreAboutChoice: {
    en: "More about this choice",
    he: "עוד על הבחירה הזאת",
    ja: "このせんたくしについてもっと",
    es: "Más sobre esta opción",
  },
  openMenu: {
    en: "Open menu",
    he: "פתיחת התפריט",
    ja: "メニューをひらく",
    es: "Abrir el menú",
  },
  closeMenu: {
    en: "Close menu",
    he: "סגירת התפריט",
    ja: "メニューをとじる",
    es: "Cerrar el menú",
  },
  readAloud: {
    en: "Read aloud",
    he: "הקראה בקול",
    ja: "よみあげる",
    es: "Leer en voz alta",
  },
  pauseReading: {
    en: "Pause reading",
    he: "השהיית ההקראה",
    ja: "よみあげをとめる",
    es: "Pausar la lectura",
  },
  restartReading: {
    en: "Read from the beginning",
    he: "הקראה מההתחלה",
    ja: "さいしょからよむ",
    es: "Leer desde el principio",
  },
} satisfies Record<string, Record<TUiLanguage, string>>;

export type TUiStringKey = keyof typeof strings;

// Synchronous: unlike useTranslation there is no request, so no loading state.
// Unknown language values fall back to English.
export const useUiStrings = () => {
  const language = usePreferencesStore.use.language();
  return (key: TUiStringKey): string =>
    strings[key][language as TUiLanguage] ?? strings[key].en;
};
