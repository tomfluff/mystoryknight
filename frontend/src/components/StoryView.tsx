import {
  Box,
  Group,
  Stack,
  Grid,
  Center,
  Loader,
  Text,
  VisuallyHidden,
} from "@mantine/core";
import StoryPart from "./StoryPart";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import {
  setStoryState,
  startStory,
  useAdventureStore,
} from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";

const StoryView = () => {
  const instance = getAxiosInstance();
  const id = useAdventureStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();
  const story = useAdventureStore.use.story();

  const { isError, isLoading } = useQuery({
    queryKey: ["story-init", id],
    queryFn: ({ signal }) => {
      return instance
        .post(
          "/story/init",
          createCallContext({
            ...character,
            ...premise,
          }),
          { signal }
        )
        .then((res) => {
          const { state, ...storyData } = res.data.data;
          startStory({ start: Date.now(), ...storyData });
          if (state) setStoryState(state);
          return res.data.data;
        });
    },
    enabled: !!id && !!character && !!premise && !story,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <Center>
        <Loader color="gray" size="xl" type="dots" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center>
        <Text c="red">Error loading story</Text>
      </Center>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <Box component={Group} align="center" justify="center" pb="xl">
      <VisuallyHidden component="h1">Your story</VisuallyHidden>
      <Grid w="100%">
        <Grid.Col span={{ sm: 12, md: 8 }} offset={{ sm: 0, md: 2 }}>
          <Stack>
            {story &&
              story.parts.length > 0 &&
              story.parts.map((part, i) => (
                <Box key={i}>
                  <VisuallyHidden component="h2">
                    Story part {i + 1}
                  </VisuallyHidden>
                  <StoryPart
                    isNew={i === story.parts.length - 1}
                    part={part}
                  />
                </Box>
              ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default StoryView;
