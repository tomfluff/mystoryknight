import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Divider,
  Image,
  Loader,
  SimpleGrid,
  Text,
  UnstyledButton,
} from "@mantine/core";
import getAxiosInstance from "../utils/axiosInstance";
import { setCharacter } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings, TUiStringKey } from "../i18n/strings";
import classes from "./HeroGallery.module.css";

/*
 * "No drawing today? Pick a hero!" -- six ready-made drawings for children
 * without a camera. They feed the exact same character-creation path as a
 * webcam capture: the picked image is converted to the same JPEG data URL
 * payload DrawingUploadModal sends and POSTed to /character, so the backend
 * builds the character sheet from the image just as it does for a live
 * drawing. Do not fork the character contract for new entry paths.
 */

const HEROES = [1, 2, 3, 4, 5, 6].map((n) => ({
  nameKey: `hero${n}Name` as TUiStringKey,
  src: `${import.meta.env.BASE_URL}heroes/hero-${n}.webp`,
}));

// Same payload format as the camera path (useWebcam's getScreenshot returns a
// JPEG data URL): draw the WebP onto a white-backed canvas and re-encode.
const toJpegDataUrl = async (src: string): Promise<string> => {
  const img = new window.Image();
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

const HeroGallery = ({ disabled }: { disabled?: boolean }) => {
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

  const busy = pickHero.isPending || disabled;

  return (
    <Box mt="md">
      <Divider label={t("galleryTitle")} labelPosition="center" mb="xs" />
      <Text size="sm" c="dimmed" mb="sm">
        {t("galleryTip")}
      </Text>
      <SimpleGrid
        cols={3}
        spacing="xs"
        aria-label={t("galleryAria")}
      >
        {HEROES.map((hero, i) => (
          <UnstyledButton
            key={hero.nameKey}
            className={classes.tile}
            onClick={() => pickHero.mutate(i)}
            disabled={busy}
            data-picking={pickHero.isPending && pickHero.variables === i}
          >
            <Image
              src={hero.src}
              alt=""
              loading="lazy"
              className={classes.art}
            />
            <Text size="xs" fw={600} ta="center" className={classes.name}>
              {t(hero.nameKey)}
            </Text>
          </UnstyledButton>
        ))}
      </SimpleGrid>
      {pickHero.isPending && (
        <Text size="sm" c="dimmed" mt="xs" role="status">
          <Loader size="xs" type="dots" mr={6} />
          {t("heroPending")}
        </Text>
      )}
      {pickHero.isError && (
        <Text size="sm" c="red" mt="xs" role="alert">
          {t("heroFailed")}
        </Text>
      )}
    </Box>
  );
};

export default HeroGallery;
