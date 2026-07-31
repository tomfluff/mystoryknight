import { useMutation } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { setCharacter } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings, TUiStringKey } from "../i18n/strings";
import classes from "./InstructionView.module.css";

/*
 * "No drawing today? Pick a hero!" — six ready-made drawings (made by other
 * children) that feed the exact same character-creation path as a webcam
 * capture: the picked image is converted to the same JPEG data URL payload
 * DrawingUploadModal sends and POSTed to /character, so the backend generates
 * the character sheet from the image just as it does for a live drawing.
 */

const HEROES = [1, 2, 3, 4, 5, 6].map((n) => ({
  nameKey: `hero${n}Name` as TUiStringKey,
  src: `${import.meta.env.BASE_URL}heroes/hero-${n}.webp`,
}));

// Same payload format as the camera path (useWebcam's getScreenshot returns a
// JPEG data URL): draw the WebP onto a white-backed canvas and re-encode.
const toJpegDataUrl = async (src: string): Promise<string> => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
};

const HeroGallery = () => {
  const instance = getAxiosInstance();
  const t = useUiStrings();

  const pickHero = useMutation({
    mutationKey: ["hero-pick"],
    mutationFn: async (heroIndex: number) => {
      const image = await toJpegDataUrl(HEROES[heroIndex].src);
      return instance
        .post("/character", createCallContext({ image, type: "jpeg" }))
        .then((res) => res.data);
    },
    // Identical to DrawingUploadModal's success path.
    onSuccess: (data) => {
      setCharacter(data.data.id, data.data.image, data.data.character);
    },
  });

  return (
    <>
      <div className={classes.orLine}>
        <h3 className={classes.orTitle}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="6" cy="6" r="2.6" />
            <circle cx="6" cy="18" r="2.6" />
            <path d="M8.3 7.6 20 16M8.3 16.4 20 8" strokeLinecap="round" />
          </svg>
          {t("galleryTitle")}
        </h3>
      </div>
      <p className={classes.galleryTip}>{t("galleryTip")}</p>
      <div className={classes.gallery} role="group" aria-label={t("galleryAria")}>
        {HEROES.map((hero, i) => (
          <button
            key={hero.nameKey}
            type="button"
            className={classes.heroTile}
            disabled={pickHero.isPending}
            onClick={() => pickHero.mutate(i)}
          >
            <span className={classes.heroTileArt}>
              {/* Decorative: the tile's visible name is the accessible name. */}
              <img src={hero.src} alt="" loading="lazy" />
            </span>
            <span className={classes.heroTileName}>{t(hero.nameKey)}</span>
            {pickHero.isPending && pickHero.variables === i && (
              <span className={classes.heroTileBadge} aria-hidden="true">
                <svg className={classes.spin} viewBox="0 0 24 24">
                  <path
                    d="M12 2l2.9 6 6.6.9-4.8 4.5 1.2 6.5L12 16.8 6.1 19.9l1.2-6.5L2.5 8.9 9.1 8z"
                    fill="#FFF6E9"
                  />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
      {pickHero.isPending && (
        <p className={classes.note} role="status">
          {t("heroPending")}
        </p>
      )}
      {pickHero.isError && !pickHero.isPending && (
        <p className={classes.errorNote} role="alert">
          {t("heroFailed")}
        </p>
      )}
    </>
  );
};

export default HeroGallery;
