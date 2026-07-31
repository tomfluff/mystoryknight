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
  openAbout: {
    en: "About MyStoryKnight",
    he: "על MyStoryKnight",
    ja: "MyStoryKnightについて",
    es: "Acerca de MyStoryKnight",
  },
  aboutTitle: {
    en: "About This Project",
    he: "על הפרויקט",
    ja: "このプロジェクトについて",
    es: "Sobre este proyecto",
  },
  aboutBody1: {
    en: "MyStoryKnight is a storytelling game for children. Draw a character and it becomes the hero of an illustrated adventure, one part at a time.",
    he: "MyStoryKnight הוא משחק סיפורים לילדים. מציירים דמות והיא הופכת לגיבור של הרפתקה מאוירת, קטע אחר קטע.",
    ja: "MyStoryKnightは、こどものためのおはなしゲームです。キャラクターをかくと、絵つきのぼうけんの主人公になります。おはなしはすこしずつすすみます。",
    es: "MyStoryKnight es un juego de cuentos para niños. Dibuja un personaje y se convertirá en el héroe de una aventura ilustrada, parte por parte.",
  },
  aboutBody2: {
    en: "You decide what happens next at every turn, so no two stories end up the same. Everything can be read aloud, which makes it as good to play beside someone as on your own.",
    he: "בכל שלב אתם מחליטים מה יקרה הלאה, כך שאף סיפור לא דומה לאחר. אפשר להקריא הכול בקול, ולכן כיף לשחק יחד וגם לבד.",
    ja: "つぎに何がおこるかは、いつもあなたがきめます。だから同じおはなしは二つとありません。ぜんぶ読み上げできるので、だれかといっしょでも、ひとりでもたのしめます。",
    es: "Tú decides qué pasa después en cada momento, así que no hay dos cuentos iguales. Todo se puede leer en voz alta, para jugar acompañado o tú solo.",
  },
  credits: {
    en: "Credits",
    he: "קרדיטים",
    ja: "クレジット",
    es: "Créditos",
  },
  license: {
    en: "License",
    he: "רישיון",
    ja: "ライセンス",
    es: "Licencia",
  },
  openPreferences: {
    en: "Open preferences",
    he: "פתיחת ההעדפות",
    ja: "せっていをひらく",
    es: "Abrir las preferencias",
  },
  preferencesTitle: {
    en: "Application Preferences",
    he: "העדפות היישום",
    ja: "アプリのせってい",
    es: "Preferencias de la aplicación",
  },
  captureDrawingTitle: {
    en: "Capture Drawing",
    he: "צילום הציור",
    ja: "絵をさつえいする",
    es: "Capturar el dibujo",
  },
  detectingCameras: {
    en: "Detecting cameras…",
    he: "מחפשים מצלמות…",
    ja: "カメラをさがしています…",
    es: "Buscando cámaras…",
  },
  selectCamera: {
    en: "Select camera",
    he: "בחרו מצלמה",
    ja: "カメラをえらんでください",
    es: "Elige la cámara",
  },
  camera: {
    en: "Camera",
    he: "מצלמה",
    ja: "カメラ",
    es: "Cámara",
  },
  send: {
    en: "Send",
    he: "שליחה",
    ja: "おくる",
    es: "Enviar",
  },
  retake: {
    en: "Retake",
    he: "צילום מחדש",
    ja: "とりなおす",
    es: "Repetir la foto",
  },
  capture: {
    en: "Capture",
    he: "צלמו",
    ja: "さつえいする",
    es: "Tomar la foto",
  },
  uploadFailed: {
    en: "That didn't work. Press Send to try again.",
    he: "זה לא עבד. לחצו על שליחה כדי לנסות שוב.",
    ja: "うまくいきませんでした。もういちど「おくる」をおしてね。",
    es: "Eso no funcionó. Pulsa Enviar para intentarlo otra vez.",
  },
  capturedDrawingAlt: {
    en: "Your captured drawing",
    he: "הציור שצילמתם",
    ja: "さつえいした絵",
    es: "Tu dibujo capturado",
  },
  cameraBlocked: {
    en: "Camera access was blocked. Allow the camera in your browser, then reopen this window.",
    he: "הגישה למצלמה נחסמה. אפשרו את המצלמה בדפדפן ופתחו שוב את החלון הזה.",
    ja: "カメラがブロックされています。ブラウザでカメラをゆるしてから、もういちどこのウィンドウをひらいてね。",
    es: "El acceso a la cámara está bloqueado. Permite la cámara en tu navegador y vuelve a abrir esta ventana.",
  },
  cameraNotFound: {
    en: "No camera found. Connect a camera and reopen this window.",
    he: "לא נמצאה מצלמה. חברו מצלמה ופתחו שוב את החלון הזה.",
    ja: "カメラが見つかりません。カメラをつないでから、もういちどこのウィンドウをひらいてね。",
    es: "No se encontró ninguna cámara. Conecta una cámara y vuelve a abrir esta ventana.",
  },
  cameraFailed: {
    en: "The camera could not be started. Check that no other app is using it.",
    he: "לא הצלחנו להפעיל את המצלמה. בדקו שאף אפליקציה אחרת לא משתמשת בה.",
    ja: "カメラをスタートできませんでした。ほかのアプリがカメラをつかっていないかたしかめてね。",
    es: "No se pudo iniciar la cámara. Comprueba que ninguna otra aplicación la esté usando.",
  },
  chatWithTitle: {
    en: "Chat with...",
    he: "לדבר עם...",
    ja: "だれとはなす？",
    es: "Hablar con...",
  },
  noOneToTalkTo: {
    en: "No one else is in the story yet",
    he: "אין עוד אף אחד בסיפור בינתיים",
    ja: "まだおはなしにはだれもいません",
    es: "Todavía no hay nadie más en el cuento",
  },
  whoToTalkTo: {
    en: "Who do you want to talk to?",
    he: "עם מי תרצו לדבר?",
    ja: "だれとはなしたい？",
    es: "¿Con quién quieres hablar?",
  },
  whatToSay: {
    en: "What do you want to say?",
    he: "מה תרצו להגיד?",
    ja: "なんて言いたい？",
    es: "¿Qué quieres decir?",
  },
  sayIt: {
    en: "Say it!",
    he: "אמרו את זה!",
    ja: "言ってみよう！",
    es: "¡Dilo!",
  },
  premiseTitle: {
    en: "Select Story Premise",
    he: "בחרו את פתיחת הסיפור",
    ja: "おはなしのはじまりをえらぶ",
    es: "Elige el comienzo del cuento",
  },
  premiseLoading: {
    en: "Dreaming up adventures for your hero…",
    he: "חולמים על הרפתקאות לגיבור שלכם…",
    ja: "ヒーローのぼうけんをかんがえています…",
    es: "Imaginando aventuras para tu héroe…",
  },
  premiseFailed: {
    en: "The adventures did not load.",
    he: "ההרפתקאות לא נטענו.",
    ja: "ぼうけんがよみこめませんでした。",
    es: "Las aventuras no cargaron.",
  },
  tryAgain: {
    en: "Try again",
    he: "נסו שוב",
    ja: "もういちど",
    es: "Inténtalo otra vez",
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
