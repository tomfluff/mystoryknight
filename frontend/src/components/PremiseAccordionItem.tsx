import useTranslation from "../hooks/useTranslation";
import { Accordion, Button, Group, Stack, Text } from "@mantine/core";
import { TPremise } from "../types/Premise";
import ReadController from "./ReadController";
import { useUiStrings } from "../i18n/strings";
import paper from "./paperChrome.module.css";

type Props = {
  premise: TPremise;
  onSelect: (premise: TPremise) => void;
};

// Each premise is its own torn scrap on the dialog's violet sheet; the
// colourway cycles by position (paperChrome.module.css .accItem:nth-child).
const PremiseAccordionItem = ({ premise, onSelect }: Props) => {
  const t = useUiStrings();
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    premise.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    premise.desc
  );

  const itemClassNames = {
    item: paper.accItem,
    control: paper.accControl,
    label: paper.accLabel,
    chevron: paper.accChevron,
  };

  if (shorttextLoading || longtextLoading) {
    return (
      <Accordion.Item value={"loading"} classNames={itemClassNames}>
        <Accordion.Control>{t("loading")}</Accordion.Control>
      </Accordion.Item>
    );
  }

  return (
    <Accordion.Item value={shorttext} classNames={itemClassNames}>
      <Accordion.Control>{shorttext}</Accordion.Control>
      <Accordion.Panel>
        <Stack className={paper.accPanelBody}>
          <Text>{longtext}</Text>
          <Group grow>
            <ReadController text={longtext} />
            <Button
              h={44}
              onClick={() => onSelect(premise)}
              classNames={{ root: paper.btn }}
            >
              {t("startAdventure")}
            </Button>
          </Group>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export default PremiseAccordionItem;
