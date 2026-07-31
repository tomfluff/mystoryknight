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
      >
        <Stack gap="sm">
          {/* order={2}: the underlying view already has the one h1; size keeps
              the h1 visual. */}
          <Title order={2} size="h1" fs="italic">
            MyStoryKnight.
          </Title>
          <Text>{t("aboutBody1")}</Text>
          <Text>{t("aboutBody2")}</Text>
          <Divider />
          <Box>
            <Text fz="md">{t("credits")}</Text>
            <Text fz="sm">
              Icons made by <i>Icon.doit</i>, <i>Smashicons</i> and{" "}
              <i>Freepik</i> from{" "}
              <Anchor href="https://www.flaticon.com/" target="_blank">
                flaticon
              </Anchor>
              .
            </Text>
          </Box>
          {/* The AGPL asks a network-served copy to offer its users the source,
              so the link belongs in the app and not only in the README. */}
          <Box>
            <Text fz="md">{t("license")}</Text>
            <Text fz="sm">
              Copyright &copy; 2026 Yotam Sechayk. MyStoryKnight is free
              software, licensed under the{" "}
              <Anchor
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
              >
                GNU AGPL, version 3 or later
              </Anchor>
              . It comes with no warranty. The source code is at{" "}
              <Anchor
                href="https://github.com/tomfluff/mystoryknight"
                target="_blank"
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
