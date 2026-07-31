import { TPremise } from "../types/Premise";
import { Card, Loader, Spoiler, Text } from "@mantine/core";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { useUiStrings } from "../i18n/strings";

type Props = {
  premise: TPremise;
};

const PremiseCard = ({ premise }: Props) => {
  const t = useUiStrings();
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    premise.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    premise.desc
  );

  if (shorttextLoading || longtextLoading)
    return (
      <Card shadow="md" my={8} padding="sm" radius="md">
        <Loader color="gray" type="dots" size="lg" />
      </Card>
    );

  return (
    <Card shadow="md" my={8} padding="sm" radius="md">
      <Card.Section mb="sm">
        <Text size="md" fw={500} p="xs" bg="violet" c="white">
          {shorttext}
        </Text>
      </Card.Section>
      <Spoiler maxHeight={50} showLabel={t("showMore")} hideLabel={t("hide")}>
        {longtext}
      </Spoiler>
      <Card.Section p="xs">
        <ReadController id="card" text={longtext} />
      </Card.Section>
    </Card>
  );
};

export default PremiseCard;
