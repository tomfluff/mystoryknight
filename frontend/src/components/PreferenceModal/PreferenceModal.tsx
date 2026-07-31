import { ActionIcon, Modal } from "@mantine/core";
import PreferencePane from "../PreferencePane";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { FaCog } from "react-icons/fa";
import { useUiStrings } from "../../i18n/strings";

const PreferenceModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const t = useUiStrings();
  const isMobile = useMediaQuery("(max-width: 48em)");

  return (
    <>
      <ActionIcon
        variant="default"
        size="lg"
        aria-label={t("openPreferences")}
        onClick={toggleOpened}
      >
        <FaCog />
      </ActionIcon>
      <Modal
        size="content"
        opened={opened}
        fullScreen={isMobile}
        centered
        title={t("preferencesTitle")}
        onClose={toggleOpened}
      >
        <PreferencePane />
      </Modal>
    </>
  );
};

export default PreferenceModal;
