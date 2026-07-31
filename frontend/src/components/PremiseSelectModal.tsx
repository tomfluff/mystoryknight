import getAxiosInstance from "../utils/axiosInstance";
import { useMediaQuery } from "@mantine/hooks";
import { Button, Container, Modal, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TCharacter } from "../types/Character";
import { setPremise } from "../stores/adventureStore";
import { TPremise } from "../types/Premise";
import PremiseOption from "./PremiseOption";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings } from "../i18n/strings";

type Props = {
  display: boolean;
  finalAction: () => void;
  character: TCharacter | null;
};

const PremiseSelectModal = ({ character, display, finalAction }: Props) => {
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const isMobile = useMediaQuery("(max-width: 48em)");

  const {
    data: premiseList,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["premise", character?.fullname],
    queryFn: ({ signal }) => {
      return instance
        .post("/story/premise", createCallContext({ ...character }), { signal })
        .then((res) => res.data.data.list);
    },
    enabled: !!character,
    staleTime: Infinity,
    refetchOnMount: false,
    // NOTE: React-Query storage and cache will only persist until refresh so need to check existing storage
  });

  /* Browsing and committing are separate: picking a card only marks it, and
     the single button below starts the story. Previously each card carried
     its own start button, so there was no way to compare without committing. */
  const [selected, setSelected] = useState<number | null>(null);

  const startAdventure = () => {
    if (selected == null || !premiseList?.[selected]) return;
    setPremise(premiseList[selected]);
    finalAction();
  };

  if (!character) return null;

  return (
    <Modal
      size="lg"
      opened={display}
      onClose={finalAction}
      title={t("premiseTitle")}
      centered
      fullScreen={isMobile}
    >
      <Container>
        {/* A read-only fetch: closing loses nothing, so exits stay enabled. */}
        {isFetching && (
          <Stack align="center">
            <Loader color="gray" type="dots" size="lg" />
            <Text>{t("premiseLoading")}</Text>
          </Stack>
        )}
        {!isFetching && (isError || premiseList?.length === 0) && (
          <Stack align="center">
            <Text c="red">{t("premiseFailed")}</Text>
            <Button
              variant="light"
              color="red"
              h={44}
              onClick={() => refetch()}
            >
              {t("tryAgain")}
            </Button>
          </Stack>
        )}
        {!isFetching && !isError && premiseList && premiseList.length > 0 && (
          <Stack gap="sm" role="radiogroup" aria-label={t("premiseTitle")}>
            {premiseList.map((premise: TPremise, index: number) => (
              <PremiseOption
                premise={premise}
                key={index}
                selected={selected === index}
                onSelect={() => setSelected(index)}
              />
            ))}
            <Button
              size="md"
              h={44}
              mt="xs"
              disabled={selected == null}
              onClick={startAdventure}
            >
              {t("startAdventure")}
            </Button>
          </Stack>
        )}
      </Container>
    </Modal>
  );
};

export default PremiseSelectModal;
