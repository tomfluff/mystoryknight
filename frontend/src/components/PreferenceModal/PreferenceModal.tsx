import { ActionIcon, Modal } from "@mantine/core";
import PreferencePane from "../PreferencePane";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { FaCog } from "react-icons/fa";
import { useUiStrings } from "../../i18n/strings";
import paper from "../paperChrome.module.css";

// Sky construction paper (paperChrome.module.css); the pane inside supplies
// its own paper fields, switches and slider.
const PreferenceModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const t = useUiStrings();
  const isMobile = useMediaQuery("(max-width: 48em)");

  return (
    <>
      <ActionIcon
        variant="default"
        size="xl"
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
        closeButtonProps={{ "aria-label": t("closeWindow") }}
        classNames={{
          overlay: paper.overlay,
          content: `${paper.content} ${paper.sheetSky}`,
          header: paper.header,
          title: paper.title,
          body: paper.body,
          close: paper.close,
        }}
      >
        <PreferencePane />
      </Modal>
    </>
  );
};

export default PreferenceModal;
