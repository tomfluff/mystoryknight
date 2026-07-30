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

const AboutModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 50em)");
  return (
    <>
      <ActionIcon
        variant="default"
        size="xl"
        aria-label="About MyStoryKnight."
        onClick={toggleOpened}
      >
        <FaInfo />
      </ActionIcon>
      <Modal
        size="md"
        opened={opened}
        fullScreen={isMobile}
        centered
        title="About This Project"
        onClose={toggleOpened}
      >
        <Stack gap="sm">
          <Title order={1} fs="italic">
            MyStoryKnight.
          </Title>
          <Text>
            MyStoryKnight is a storytelling game for children. Draw a character
            and it becomes the hero of an illustrated adventure, one part at a
            time.
          </Text>
          <Text>
            You decide what happens next at every turn, so no two stories end up
            the same. Everything can be read aloud, which makes it as good to
            play beside someone as on your own.
          </Text>
          <Divider />
          <Box>
            <Text fz="md">Credits</Text>
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
            <Text fz="md">License</Text>
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
