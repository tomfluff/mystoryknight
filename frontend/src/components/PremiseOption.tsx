import useTranslation from "../hooks/useTranslation";
import { Group, Loader, Paper, Radio, Stack, Text } from "@mantine/core";
import { TPremise } from "../types/Premise";
import ReadController from "./ReadController";
import classes from "./PremiseOption.module.css";

type Props = {
  premise: TPremise;
  selected: boolean;
  onSelect: () => void;
};

/*
 * One selectable premise. The whole card is the radio's label, so tapping
 * anywhere on it selects -- a child should not have to hit the small circle.
 * Committing is a separate button in the modal, so nothing starts the story
 * by accident while browsing the options.
 */
const PremiseOption = ({ premise, selected, onSelect }: Props) => {
  const { data: title, isLoading: titleLoading } = useTranslation(premise.title);
  const { data: desc, isLoading: descLoading } = useTranslation(premise.desc);

  if (titleLoading || descLoading) {
    return (
      <Paper withBorder p="sm" radius="md">
        <Loader size="xs" type="dots" />
      </Paper>
    );
  }

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      component="label"
      className={classes.option}
      data-selected={selected || undefined}
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        <Radio
          checked={selected}
          onChange={onSelect}
          size="sm"
          aria-label={title}
          mt={2}
        />
        <Stack gap={4} flex={1} miw={0}>
          <Text size="sm" fw={600}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {desc}
          </Text>
          {/* Stop the click bubbling to the label: pressing play should read
              the premise aloud, not also select it. */}
          <div onClick={(e) => e.preventDefault()}>
            <ReadController text={desc} />
          </div>
        </Stack>
      </Group>
    </Paper>
  );
};

export default PremiseOption;
