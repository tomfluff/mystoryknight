import { Box, Stack, Grid, Loader, VisuallyHidden } from "@mantine/core";
import StoryPart from "./StoryPart";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import {
  setStoryState,
  startStory,
  useAdventureStore,
} from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings } from "../i18n/strings";
import classes from "./StoryView.module.css";
import paperClasses from "./paper.module.css";

const StoryView = () => {
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const id = useAdventureStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();
  const story = useAdventureStore.use.story();
  // Planned total parts for the "Part N of M" chips; legacy sessions have no
  // storyState, and the chip degrades to "Part N".
  const partTotal = useAdventureStore.use.storyState()?.beat.target;

  const { isError, isLoading, refetch } = useQuery({
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

  if (!story && !isLoading && !isError) {
    return null;
  }

  return (
    <div className={classes.storyMat}>
      <div className={paperClasses.grain} aria-hidden="true" />
      <VisuallyHidden component="h1">{t("yourStory")}</VisuallyHidden>
      {isLoading && (
        <div className={classes.stateScrap}>
          <Loader color="var(--ink)" size="md" type="dots" />
        </div>
      )}
      {isError && (
        <div className={classes.stateScrap} role="alert">
          <p className={classes.stateError}>{t("storyFailed")}</p>
          <button
            type="button"
            className={classes.retryBtn}
            onClick={() => refetch()}
          >
            {t("tryAgain")}
          </button>
        </div>
      )}
      {story && (
        <Grid w="100%" m={0}>
          <Grid.Col span={{ sm: 12, md: 8 }} offset={{ sm: 0, md: 2 }}>
            <Stack>
              {story.parts.length > 0 &&
                story.parts.map((part, i) => (
                  <Box key={i}>
                    {/* Same label the sighted part chip shows (SR parity). */}
                    <VisuallyHidden component="h2">
                      {partTotal != null && i + 1 <= partTotal
                        ? t("partChipOf")
                            .replace("{n}", String(i + 1))
                            .replace("{m}", String(partTotal))
                        : t("partChip").replace("{n}", String(i + 1))}
                    </VisuallyHidden>
                    <StoryPart
                      isNew={i === story.parts.length - 1}
                      part={part}
                      partIndex={i + 1}
                      partTotal={partTotal}
                    />
                  </Box>
                ))}
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </div>
  );
};

export default StoryView;
