import { useState } from "react";
import {
  Card,
  Text,
  Switch,
  Slider,
  Stack,
  Select,
  Box,
  Divider,
} from "@mantine/core";
import {
  setPreferences,
  usePreferencesStore,
} from "../stores/preferencesStore";
import { complexityOptions, languageOptions } from "../utils/llmIntegration";
import { useOs } from "@mantine/hooks";
import { TUiStringKey, useUiStrings } from "../i18n/strings";

// Slider mark labels come from complexityOptions; map them to string keys so
// they follow the language preference.
const complexityLabelKeys: Record<string, TUiStringKey> = {
  Easy: "complexityEasy",
  Medium: "complexityMedium",
  Hard: "complexityHard",
  Expert: "complexityExpert",
};

const PreferencePane = () => {
  const os = useOs();
  const t = useUiStrings();
  const storyLanguageOptions = languageOptions.map((d) => ({
    label: d.label,
    value: d.value,
  }));
  const storyComplexityOptions = complexityOptions.map((d) => ({
    label: t(complexityLabelKeys[d.label]),
    value: d.value,
  }));
  const maxComplexity = Math.max(...complexityOptions.map((d) => d.value));
  const minComplexity = Math.min(...complexityOptions.map((d) => d.value));

  const [language, setLanguage] = useState(
    usePreferencesStore.getState().language
  );
  const [autoReadStorySections, setAutoReadStorySections] = useState(
    usePreferencesStore.getState().autoReadStorySections
  );
  const [includeStoryImages, setIncludeStoryImages] = useState(
    usePreferencesStore.getState().includeStoryImages
  );
  const [storyComplexity, setStoryComplexity] = useState(
    usePreferencesStore.getState().storyComplexity
  );

  return (
    <Card shadow="sm">
      <Stack gap="md">
        <Select
          label={t("storyLanguage")}
          description={t("storyLanguageDesc")}
          size="sm"
          radius="md"
          data={storyLanguageOptions}
          value={language}
          onChange={(_value, option) => {
            setPreferences({ language: option.value });
            setLanguage(option.value);
          }}
        />
        <Divider />
        {/* size="sm": settings are a secondary-tier surface (docs/DESIGN.md,
            Interaction), same scale as the entry flow's Buttons -- xl/32px
            here read as oversized against the rest of the app. */}
        <Switch
          size="sm"
          checked={autoReadStorySections}
          onChange={(e) => {
            setPreferences({ autoReadStorySections: e.currentTarget.checked });
            setAutoReadStorySections(e.currentTarget.checked);
          }}
          label={t("autoRead")}
          description={t("autoReadDesc")}
          disabled={os === "ios"}
        />

        <Switch
          size="sm"
          checked={includeStoryImages}
          onChange={(e) => {
            setPreferences({ includeStoryImages: e.currentTarget.checked });
            setIncludeStoryImages(e.currentTarget.checked);
          }}
          label={t("storyImages")}
          description={t("storyImagesDesc")}
        />

        <Divider />
        <Box>
          <Text size="sm">{t("storyComplexity")}</Text>
          <Slider
            size="sm"
            marks={storyComplexityOptions}
            label={null}
            value={storyComplexity}
            onChange={(value) => {
              setPreferences({ storyComplexity: value });
              setStoryComplexity(value);
            }}
            step={1}
            min={minComplexity}
            max={maxComplexity}
            mb="md"
            mt="xs"
          />
        </Box>
      </Stack>
    </Card>
  );
};

export default PreferencePane;
