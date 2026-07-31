import { Spoiler, Loader } from "@mantine/core";
import { TCharacter } from "../types/Character";
import { TImage } from "../types/Image";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { useUiStrings } from "../i18n/strings";
import classes from "./CharacterCard.module.css";

type Props = {
  image: TImage;
  character: TCharacter;
};

/* One chip per personality trait. Translation is a nicety, the trait is not:
   while loading (or on failure) the original text renders. */
const TraitChip = ({ trait }: { trait: string }) => {
  const { data } = useTranslation(trait);
  return <li>{data ?? trait}</li>;
};

const CharacterCard = ({ image, character }: Props) => {
  const t = useUiStrings();
  const { data: fullname, isLoading: fullnameLoading } = useTranslation(
    character.fullname
  );
  const { data: backstory, isLoading: backstoryLoading } = useTranslation(
    character.backstory
  );

  return (
    <div className={classes.card}>
      <span className={classes.tag}>{t("yourHeroTag")}</span>
      <span className={classes.art}>
        <img src={image.src} alt={image.content} loading="lazy" />
      </span>
      {fullname && <p className={classes.name}>{fullname}</p>}
      {character.personality && character.personality.length > 0 && (
        <ul className={classes.traits}>
          {character.personality.map((trait) => (
            <TraitChip key={trait} trait={trait} />
          ))}
        </ul>
      )}
      {backstory && (
        <Spoiler
          maxHeight={100}
          showLabel={t("showMore")}
          hideLabel={t("hide")}
          className={classes.backstory}
          classNames={{ control: classes.spoilerControl }}
        >
          {backstory}
        </Spoiler>
      )}
      {(fullnameLoading || backstoryLoading) && (
        <Loader color="var(--ink)" type="dots" size="lg" />
      )}
      <div className={classes.controls}>
        <ReadController text={backstory} />
      </div>
    </div>
  );
};

export default CharacterCard;
