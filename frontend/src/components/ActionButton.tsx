import { Text, Popover, Stack, Loader } from "@mantine/core";
import { TAction } from "../types/Story";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { useUiStrings } from "../i18n/strings";
import classes from "./ActionButton.module.css";

type Props = {
  action: TAction;
  handleClick: () => void;
  // Sparkle this action (used for Ending once the story reaches resolution).
  // Suggestion only -- the child always decides.
  emphasis?: boolean;
  // Alternate paper colourway. Assigned by list position in StoryPart, purely
  // decorative variety -- never a meaning signal (DESIGN.md: the Ending
  // affordance is the sparkles, not a colour).
  alt?: boolean;
};

const ActionButton = ({ action, handleClick, emphasis, alt }: Props) => {
  const t = useUiStrings();
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    action.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    action.desc
  );

  return (
    <div className={`${classes.unit} ${emphasis ? classes.wrapper : ""}`}>
      {emphasis && (
        <span className={classes.stars} aria-hidden="true">
          <span className={classes.star}>✦</span>
          <span className={classes.star}>✧</span>
          <span className={classes.star}>✦</span>
          <span className={classes.star}>✧</span>
          <span className={classes.star}>✦</span>
          <span className={classes.star}>✧</span>
        </span>
      )}
      <button
        type="button"
        className={`${classes.flap} ${alt ? classes.flapAlt : ""}`}
        onClick={handleClick}
        disabled={!action.active && !action.used}
      >
        <span className={classes.flapLabel}>
          {shorttextLoading && (
            <Loader color="var(--ink)" size="sm" type="dots" p={0} m={0} />
          )}
          {shorttext && shorttext}
        </span>
        {action.used ? (
          /* The taken choice: shape marks it, not colour alone. */
          <span className={classes.flapCheck} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M4.5 12.5l5 5 10-11"
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <span className={classes.flapArrow} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M3 12h15M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
      <Popover width={300} position="top" withinPortal withArrow>
        <Popover.Target>
          <button
            type="button"
            className={classes.moreBtn}
            aria-label={t("moreAboutChoice")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="5" r="2.2" fill="currentColor" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              <circle cx="12" cy="19" r="2.2" fill="currentColor" />
            </svg>
          </button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <Text>
              {longtextLoading && (
                <Loader size="sm" type="dots" p={0} m={0} />
              )}
              {longtext && longtext}
            </Text>
            <ReadController id="action" text={longtext} />
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};

export default ActionButton;
