import useTranslation from "../hooks/useTranslation";
import { Accordion, Button, Group, Stack, Text } from "@mantine/core";
import { TPremise } from "../types/Premise";
import ReadController from "./ReadController";
import { useUiStrings } from "../i18n/strings";

type Props = {
  premise: TPremise;
  onSelect: (premise: TPremise) => void;
};

const PremiseAccordionItem = ({ premise, onSelect }: Props) => {
  const t = useUiStrings();
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    premise.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    premise.desc
  );

  if (shorttextLoading || longtextLoading) {
    return (
      <Accordion.Item value={"loading"}>
        <Accordion.Control>{t("loading")}</Accordion.Control>
      </Accordion.Item>
    );
  }

  return (
    <Accordion.Item value={shorttext}>
      <Accordion.Control>{shorttext}</Accordion.Control>
      <Accordion.Panel>
        <Stack>
          <Text>{longtext}</Text>
          <Group grow>
            <ReadController text={longtext} />
            <Button onClick={() => onSelect(premise)}>
              {t("startAdventure")}
            </Button>
          </Group>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export default PremiseAccordionItem;
