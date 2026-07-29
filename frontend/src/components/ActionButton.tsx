import { Text, Button, Group, Popover, Stack, Loader } from "@mantine/core";
import { TAction } from "../types/Story";
import { FaEllipsisVertical } from "react-icons/fa6";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import classes from "./ActionButton.module.css";

type Props = {
  action: TAction;
  handleClick: () => void;
  // Sparkle this action (used for Ending once the story reaches resolution).
  // Suggestion only -- the child always decides.
  emphasis?: boolean;
};

const ActionButton = ({ action, handleClick, emphasis }: Props) => {
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    action.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    action.desc
  );

  return (
    <Group wrap="nowrap" gap={0} className={emphasis ? classes.wrapper : undefined}>
      {emphasis && (
        <span className={classes.stars} aria-hidden="true">
          <span className={classes.star}>✦</span>
          <span className={classes.star}>✧</span>
          <span className={classes.star}>✦</span>
          <span className={classes.star}>✧</span>
        </span>
      )}
      <Button
        size="sm"
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
        color={!action.active ? (action.used ? "violet" : "gray") : "violet"}
        onClick={handleClick}
        disabled={!action.active && !action.used}
        /* Not "capitalize": titles are now sentence-style instructions, and
           Title Casing them gives "Follow The Red Smudge". */
        tt="none"
      >
        {shorttextLoading && (
          <Loader color="white" size="sm" type="dots" p={0} m={0} />
        )}
        {shorttext && shorttext}
      </Button>
      <Popover width={300} position="top" withinPortal withArrow>
        <Popover.Target>
          <Button
            size="sm"
            px="xs"
            color={
              !action.active ? (action.used ? "violet" : "gray") : "violet"
            }
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            <FaEllipsisVertical />
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <Text>
              {longtextLoading && (
                <Loader color="white" size="sm" type="dots" p={0} m={0} />
              )}
              {longtext && longtext}
            </Text>
            <ReadController id="action" text={longtext} />
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
};

export default ActionButton;
