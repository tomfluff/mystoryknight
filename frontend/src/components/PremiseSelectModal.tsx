import getAxiosInstance from "../utils/axiosInstance";
import { useMediaQuery } from "@mantine/hooks";
import {
  Accordion,
  Button,
  Container,
  Modal,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { TCharacter } from "../types/Character";
import { setPremise } from "../stores/adventureStore";
import { TPremise } from "../types/Premise";
import PremiseAccordionItem from "./PremiseAccordionItem";
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

  const handlePremiseSelect = (premise: TPremise) => {
    setPremise(premise);
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
          <Accordion>
            {premiseList.map((premise: TPremise, index: number) => {
              return (
                <PremiseAccordionItem
                  premise={premise}
                  key={index}
                  onSelect={handlePremiseSelect}
                />
              );
            })}
          </Accordion>
        )}
      </Container>
    </Modal>
  );
};

export default PremiseSelectModal;
