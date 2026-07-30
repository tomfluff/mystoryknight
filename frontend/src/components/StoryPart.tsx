import { useEffect } from "react";
import {
  Image,
  Badge,
  Box,
  Flex,
  Paper,
  useMantineColorScheme,
  Avatar,
  Group,
  Stack,
  Loader,
  Skeleton,
} from "@mantine/core";
import { useMediaQuery, useScrollIntoView } from "@mantine/hooks";
import ReadController from "./ReadController";
import { TAction, TActionKind, TStoryPart } from "../types/Story";
import ActionButton from "./ActionButton";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  appendStory,
  chooseAction,
  restoreActions,
  setFinished,
  setStoryState,
  updateActions,
  updateStoryImage,
  useAdventureStore,
} from "../stores/adventureStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import useTranslation from "../hooks/useTranslation";
import { buildStoryContext, createCallContext } from "../utils/llmIntegration";
import { useSessionStore } from "../stores/sessionStore";
import { useDisclosure } from "@mantine/hooks";
import ChatUploadModal from "./ChatUploadModal";

type Props = {
  part: TStoryPart;
  isNew: boolean;
};

/* Typed on purpose: these payloads were `any`, which let a TAction object be
   sent where the prompt expected a string. */
type TStoryCallContext = ReturnType<typeof buildStoryContext> & {
  action?: string;
  action_source?: "choice" | "chat";
};

/*
 * Actions carry an explicit `kind` from the backend. Stories already in
 * sessionStorage when that field shipped rehydrate without it, so fall back to
 * the old title match for those. Deletable once no legacy sessions can exist.
 */
const actionKind = (action: TAction): TActionKind => {
  if (action.kind) return action.kind;
  const title = action.title.toLowerCase();
  if (title === "ending") return "ending";
  if (title === "motion capture") return "motion_capture";
  return "choice";
};

const StoryPart = ({ part, isNew }: Props) => {
  const instance = getAxiosInstance();
  const { colorScheme } = useMantineColorScheme();
  const isSm = useMediaQuery("(max-width: 48em)");
  const { targetRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const user_avatar = useSessionStore.use.avatar();

  const { data: text, isLoading: textLoading } = useTranslation(part.text);

  const autoReadStorySections = usePreferencesStore.use.autoReadStorySections();
  const includeStoryImages = usePreferencesStore.use.includeStoryImages();

  const finished = useAdventureStore.use.finished();
  const storyPhase = useAdventureStore.use.storyState()?.beat.phase;

  const { isLoading: actionLoading } = useQuery({
    queryKey: ["actions", part.id],
    queryFn: ({ signal }) => {
      return instance
        .post("/story/actions", createCallContext(buildStoryContext()), {
          signal,
        })
        .then((res) => {
          updateActions(part.id, res.data.data.list);
          scrollIntoView();
          return res.data.data.list;
        });
    },
    enabled:
      !finished &&
      (!part.actions || (!!part.actions && part.actions.length === 0)),
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const { isLoading: imageLoading } = useQuery({
    queryKey: ["story-image", part.id],
    queryFn: ({ signal }) => {
      const image = useAdventureStore.getState().image;
      // Latest illustrated part: its image carries the rendering style and the
      // character's current look forward (Image 2 in the backend prompt).
      const previousImage = [...(useAdventureStore.getState().story?.parts ?? [])]
        .reverse()
        .find((p) => p.image && p.id !== part.id)?.image;
      return instance
        .post(
          "/story/image",
          {
            content: part.keymoment,
            // A data URL passes through whole (inline mode stores nothing, so
            // the client is the only holder); a stored URL sends just the
            // filename and the backend reads the bytes back.
            previous_image: previousImage?.startsWith("data:")
              ? previousImage
              : previousImage?.split("/").pop(),
            // The passage the child just read: grounds the scene so the image
            // depicts this part, not a loose interpretation of one sentence.
            story_text: part.text,
            // Maps to the illustration's lighting/mood.
            sentiment: part.sentiment,
            style: image?.style,
            // The child's original drawing: used as the reference image so the
            // protagonist looks the same in every illustration.
            reference_image: image?.src,
            character: { content: image?.content, colors: image?.colors },
          },
          { signal }
        )
        .then((res) => {
          updateStoryImage(
            part.id,
            res.data.data.image_url,
            res.data.data.seconds
          );
          return res.data.data;
        });
    },
    enabled: !part.image && includeStoryImages,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const outcome = useMutation({
    mutationKey: ["story-part"],
    mutationFn: (context: TStoryCallContext) => {
      scrollIntoView();
      return instance
        .post("/story/part", createCallContext({ ...context }))
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      const { state, ...part } = data;
      appendStory(part);
      if (state) setStoryState(state);
    },
    // Put the choices back. chooseAction disabled all of them before the
    // request, so without this a single failed call ends the story for good.
    onError: () => restoreActions(part.id),
  });

  const ending = useMutation({
    mutationKey: ["story-end"],
    mutationFn: (context: TStoryCallContext) => {
      return instance
        .post("/story/end", createCallContext(context))
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      appendStory(data);
      setFinished();
    },
    onError: () => restoreActions(part.id),
  });

  const handleActionClick = (
    action: TAction,
    chat: { character: string; message: string } | null = null
  ) => {
    if (!action.active) return;
    // Build the context before disabling anything: the early return below used
    // to leave the actions disabled with no request in flight to re-enable
    // them, which is the same dead end a failed request caused.
    const context = buildStoryContext();
    if (!context.state) return;
    chooseAction(part.id, action);
    if (actionKind(action) === "ending") {
      ending.mutate(context);
    } else {
      // The prompt expects `action` as a sentence, not an object -- sending the
      // TAction leaked `id`/`active`/`used` into the prompt as noise.
      outcome.mutate({
        ...context,
        action: chat
          ? `Say to ${chat.character}: "${chat.message}"`
          : `${action.title}: ${action.desc}`,
        action_source: chat ? "chat" : "choice",
      });
    }
  };

  useEffect(() => {
    if (isNew) {
      scrollIntoView();
    }
  }, [isNew, text, scrollIntoView]);

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();

  return (
    <>
      <Stack gap="sm">
        <Flex direction={isSm ? "column" : "row"} gap="sm">
          <Group gap="sm" align="start" justify={"flex-start"}>
            <Avatar
              src={
                part.sentiment
                  ? `avatar/bot/bot${part.sentiment}.png`
                  : "avatar/bot/botneutral.png"
              }
              radius="sm"
            />
          </Group>
          {includeStoryImages && (
            <Group gap="sm" align="start" justify="center">
              {part.image ? (
                <Box pos="relative" w={240} h={240}>
                  <Image
                    src={part.image}
                    alt={part.keymoment}
                    radius="md"
                    w={240}
                    h={240}
                  />
                  {part.imageSeconds != null && (
                    <Badge
                      pos="absolute"
                      bottom={6}
                      left={6}
                      size="sm"
                      variant="filled"
                      color="dark"
                      style={{ opacity: 0.75 }}
                    >
                      {part.imageSeconds}s
                    </Badge>
                  )}
                </Box>
              ) : (
                imageLoading && <Skeleton radius="md" w={240} h={240} />
              )}
            </Group>
          )}
          <Box maw={{ sm: "100%", md: "50%" }}>
            <Stack gap="xs">
              <Paper
                radius="md"
                p="sm"
                bg={colorScheme === "dark" ? "violet.8" : "violet.4"}
                c={"white"}
              >
                {textLoading && (
                  <Loader color="white" size="sm" type="dots" p={0} m={0} />
                )}
                {text && text}
              </Paper>
              <ReadController
                id={part.id}
                text={text}
                autoPlay={isNew && autoReadStorySections}
              />
            </Stack>
          </Box>
        </Flex>
        <Flex
          ref={targetRef}
          direction={isSm ? "column" : "row-reverse"}
          justify="flex-start"
          align="flex-end"
          gap="sm"
        >
          <Avatar src={`avatar/user/${user_avatar}`} radius="sm" />
          {finished && isNew && (
            <Paper
              radius="md"
              p="sm"
              bg={colorScheme === "dark" ? "violet.8" : "violet.4"}
              c={"white"}
            >
              The story has ended
            </Paper>
          )}
          {part.actions &&
            part.actions.map((action: TAction, i: number) => {
              // Legacy sessions may still hold a Motion Capture action; the
              // feature is gone, so hide it.
              if (actionKind(action) === "motion_capture") return null;
              if (actionKind(action) === "chat") {
                return (
                  <Box key={i}>
                    <ActionButton
                      action={action}
                      handleClick={() => openCapture()}
                    />
                    <ChatUploadModal
                      display={captureModal}
                      finalAction={closeCapture}
                      handleChat={(character, message) => {
                        handleActionClick(action, { character, message });
                      }}
                    />
                  </Box>
                );
              } else {
                return (
                  <ActionButton
                    key={i}
                    action={action}
                    handleClick={() => handleActionClick(action)}
                    emphasis={
                      actionKind(action) === "ending" &&
                      storyPhase === "resolution" &&
                      // Stop sparkling the moment any choice is taken:
                      // chooseAction clears `active` on every action.
                      action.active
                    }
                  />
                );
              }
            })}
          {(actionLoading || outcome.isPending || ending.isPending) && (
            <Loader color="gray" size="md" />
          )}
        </Flex>
      </Stack>
    </>
  );
};

export default StoryPart;
