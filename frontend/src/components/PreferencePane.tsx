import { useState } from "react";
import { Text, Switch, Slider, Stack, Select, Box, Divider } from "@mantine/core";
import paper from "./paperChrome.module.css";
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

  // Paper switch/slider parts (paperChrome.module.css); reused by both
  // controls so the two read as one control set.
  const switchClassNames = {
    root: paper.switchRoot,
    input: paper.switchInput,
    track: paper.switchTrack,
    thumb: paper.switchThumb,
    label: paper.switchLabel,
    description: paper.switchDesc,
  };

  return (
    // No Card: hosted inside the preferences sheet, a card would be a
    // container inside a container (border + shadow + double padding) for no
    // hierarchy gain.
    <Stack gap="md">
      <Select
        label={t("storyLanguage")}
        description={t("storyLanguageDesc")}
        size="md"
        data={storyLanguageOptions}
        value={language}
        onChange={(_value, option) => {
          setPreferences({ language: option.value });
          setLanguage(option.value);
        }}
        classNames={{
          wrapper: paper.fieldWrapper,
          input: paper.fieldInput,
          section: paper.fieldSection,
          label: paper.fieldLabel,
          description: paper.fieldDesc,
          dropdown: paper.dropdown,
          option: paper.option,
        }}
      />
      <Divider className={paper.rule} />
      {/* size="xl" with the paper track redefined to 44px, and a 44px slider
          bead, put both controls on the touch-target floor (DESIGN.md): the
          operator is often a child on a phone. */}
      <Switch
        size="xl"
        checked={autoReadStorySections}
        onChange={(e) => {
          setPreferences({ autoReadStorySections: e.currentTarget.checked });
          setAutoReadStorySections(e.currentTarget.checked);
        }}
        label={t("autoRead")}
        description={t("autoReadDesc")}
        disabled={os === "ios"}
        classNames={switchClassNames}
      />

      <Switch
        size="xl"
        checked={includeStoryImages}
        onChange={(e) => {
          setPreferences({ includeStoryImages: e.currentTarget.checked });
          setIncludeStoryImages(e.currentTarget.checked);
        }}
        label={t("storyImages")}
        description={t("storyImagesDesc")}
        classNames={switchClassNames}
      />

      <Divider className={paper.rule} />
      <Box>
        <Text className={paper.fieldLabel}>{t("storyComplexity")}</Text>
        <Slider
          size="lg"
          thumbSize={44}
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
          mb="xl"
          mt="md"
          classNames={{
            root: paper.sliderRoot,
            thumb: paper.sliderThumb,
            mark: paper.sliderMark,
            markLabel: paper.sliderMarkLabel,
          }}
        />
      </Box>
    </Stack>
  );
};

export default PreferencePane;
