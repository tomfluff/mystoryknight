import getAxiosInstance from "../utils/axiosInstance";
import { useMediaQuery } from "@mantine/hooks";
import {
  Accordion,
  Button,
  Container,
  Modal,
  Loader,
  Stack,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { TCharacter } from "../types/Character";
import { setPremise } from "../stores/adventureStore";
import { TPremise } from "../types/Premise";
import PremiseAccordionItem from "./PremiseAccordionItem";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings } from "../i18n/strings";
import paper from "./paperChrome.module.css";
import world from "./paper.module.css";

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
      closeButtonProps={{ "aria-label": t("closeWindow") }}
      classNames={{
        overlay: paper.overlay,
        // Violet, like the entry view's step-three sheet this modal opens
        // from; the premises themselves are the coloured scraps on top.
        content: `${paper.content} ${paper.sheetViolet}`,
        header: paper.header,
        title: paper.title,
        body: paper.body,
        close: paper.close,
      }}
    >
      <Container>
        {/* A read-only fetch: closing loses nothing, so exits stay enabled. */}
        {isFetching && (
          <Stack align="center">
            <Loader className={paper.loaderCream} type="dots" size="lg" />
            {/* Plain <p>s: the world's status/error paint their own colour,
                and a Mantine Text would layer --text-color back over it. */}
            <p className={paper.status}>{t("premiseLoading")}</p>
          </Stack>
        )}
        {!isFetching && (isError || premiseList?.length === 0) && (
          <Stack align="center">
            <p className={world.errorChip} role="alert">
              {t("premiseFailed")}
            </p>
            <Button
              h={44}
              onClick={() => refetch()}
              classNames={{ root: paper.retryBtn }}
            >
              {t("tryAgain")}
            </Button>
          </Stack>
        )}
        {!isFetching && !isError && premiseList && premiseList.length > 0 && (
          <Accordion classNames={{ root: paper.accRoot }}>
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
