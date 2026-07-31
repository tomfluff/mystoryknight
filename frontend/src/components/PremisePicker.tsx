import { useState } from "react";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { TCharacter } from "../types/Character";
import { TPremise } from "../types/Premise";
import { setPremise } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import PremiseOption from "./PremiseOption";
import { useUiStrings } from "../i18n/strings";

/*
 * Premise selection, inline in step 3 of the entry card. It used to be a
 * modal, which meant the last setup step worked differently from the first
 * two and hid its own loading behind a button. Browsing and committing stay
 * separate: picking a card only marks it, the button below starts the story.
 */
const PremisePicker = ({ character }: { character: TCharacter }) => {
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const [selected, setSelected] = useState<number | null>(null);

  const {
    data: premiseList,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["premise", character.fullname],
    queryFn: ({ signal }) => {
      return instance
        .post("/story/premise", createCallContext({ ...character }), { signal })
        .then((res) => res.data.data.list);
    },
    enabled: !!character,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  if (isFetching) {
    return (
      <Stack gap="xs" mt="xs">
        <Loader size="sm" type="dots" />
        <Text size="sm" c="dimmed" role="status">
          {t("premiseNoteWaiting")}
        </Text>
      </Stack>
    );
  }

  if (isError || premiseList?.length === 0) {
    return (
      <Stack gap="xs" align="flex-start" mt="xs">
        <Text size="sm" c="red">
          {t("premiseFailed")}
        </Text>
        <Button variant="light" color="red" size="sm" onClick={() => refetch()}>
          {t("tryAgain")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xs" mt="xs" role="radiogroup" aria-label={t("premiseTitle")}>
      {premiseList?.map((premise: TPremise, index: number) => (
        <PremiseOption
          premise={premise}
          key={index}
          selected={selected === index}
          onSelect={() => setSelected(index)}
        />
      ))}
      <Button
        size="sm"
        mt={4}
        disabled={selected == null}
        onClick={() => {
          if (selected != null && premiseList?.[selected]) {
            setPremise(premiseList[selected]);
          }
        }}
      >
        {t("startAdventure")}
      </Button>
    </Stack>
  );
};

export default PremisePicker;
