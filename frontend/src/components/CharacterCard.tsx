import { Card, Spoiler, Text, Image, rem, Loader } from "@mantine/core";
import { TCharacter } from "../types/Character";
import { TImage } from "../types/Image";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { useUiStrings } from "../i18n/strings";

type Props = {
  image: TImage;
  character: TCharacter;
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
    <Card shadow="sm" my={8} padding="sm" radius="md" withBorder>
      <Card.Section mb="sm">
        <Image src={image.src} alt={image.content} height={rem(128)} />
      </Card.Section>
      {fullname && (
        <Text size="lg" fw={500}>
          {fullname}
        </Text>
      )}
      {backstory && (
        <Spoiler maxHeight={100} showLabel={t("showMore")} hideLabel={t("hide")}>
          {backstory}
        </Spoiler>
      )}
      {(fullnameLoading || backstoryLoading) && (
        <Loader color="gray" type="dots" size="lg" />
      )}
      <Card.Section p="xs">
        <ReadController text={backstory} />
      </Card.Section>
    </Card>
  );
};

export default CharacterCard;
