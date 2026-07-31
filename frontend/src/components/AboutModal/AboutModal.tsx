import {
  Stack,
  ActionIcon,
  Modal,
  Title,
  Text,
  Anchor,
  Divider,
  Box,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { FaInfo } from "react-icons/fa";
import { useUiStrings } from "../../i18n/strings";
import paper from "../paperChrome.module.css";

/*
 * The dialog is a marigold construction-paper sheet (paperChrome.module.css):
 * the modal title is the one headline -- the old inner "MyStoryKnight." title
 * competed with it inside the first 60px, and the brand name is already the
 * first thing the body copy says. Credits/License are real h3s so a screen
 * reader can jump to them; the Mantine title is the h2, so the view keeps its
 * single h1.
 */
const AboutModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const t = useUiStrings();
  const isMobile = useMediaQuery("(max-width: 48em)");
  return (
    <>
      <ActionIcon
        variant="default"
        size="xl"
        aria-label={t("openAbout")}
        onClick={toggleOpened}
      >
        <FaInfo />
      </ActionIcon>
      <Modal
        size="md"
        opened={opened}
        fullScreen={isMobile}
        centered
        title={t("aboutTitle")}
        onClose={toggleOpened}
        closeButtonProps={{ "aria-label": t("closeWindow") }}
        classNames={{
          overlay: paper.overlay,
          content: `${paper.content} ${paper.sheetMarigold}`,
          header: paper.header,
          title: paper.title,
          body: paper.body,
          close: paper.close,
        }}
      >
        <Stack gap="sm">
          <Text>{t("aboutBody1")}</Text>
          <Text>{t("aboutBody2")}</Text>
          <Divider className={paper.rule} />
          <Box>
            <Title order={3} className={paper.subhead}>
              {t("credits")}
            </Title>
            <Text fz="sm" className={paper.quiet}>
              Icons made by <i>Icon.doit</i>, <i>Smashicons</i> and{" "}
              <i>Freepik</i> from{" "}
              <Anchor
                href="https://www.flaticon.com/"
                target="_blank"
                className={paper.link}
              >
                flaticon
              </Anchor>
              .
            </Text>
          </Box>
          {/* The AGPL asks a network-served copy to offer its users the source,
              so the link belongs in the app and not only in the README. */}
          <Box>
            <Title order={3} className={paper.subhead}>
              {t("license")}
            </Title>
            <Text fz="sm" className={paper.quiet}>
              Copyright &copy; 2026 Yotam Sechayk. MyStoryKnight is free
              software, licensed under the{" "}
              <Anchor
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                className={paper.link}
              >
                GNU AGPL, version 3 or later
              </Anchor>
              . It comes with no warranty. The source code is at{" "}
              <Anchor
                href="https://github.com/tomfluff/mystoryknight"
                target="_blank"
                className={paper.link}
              >
                github.com/tomfluff/mystoryknight
              </Anchor>
              .
            </Text>
          </Box>
        </Stack>
      </Modal>
    </>
  );
};

export default AboutModal;
