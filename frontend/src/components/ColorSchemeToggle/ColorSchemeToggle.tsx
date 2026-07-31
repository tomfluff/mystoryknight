import cx from "clsx";
import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import { FaSun, FaMoon } from "react-icons/fa";
import classes from "./ColorSchemeToggle.module.css";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  /* No wrapper: the toggle is one control in the header/navbar control row,
     and its own Group was fighting that row's gap. */
  return (
    <ActionIcon
      onClick={() =>
        setColorScheme(computedColorScheme === "light" ? "dark" : "light")
      }
      variant="default"
      size="xl"
      aria-label="Toggle color scheme"
    >
      <FaSun className={cx(classes.icon, classes.light)} />
      <FaMoon className={cx(classes.icon, classes.dark)} />
    </ActionIcon>
  );
}
