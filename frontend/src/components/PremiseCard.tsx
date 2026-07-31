import { TPremise } from "../types/Premise";
import { Loader, Spoiler } from "@mantine/core";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { useUiStrings } from "../i18n/strings";
import classes from "./PremiseCard.module.css";

type Props = {
  premise: TPremise;
};

const PremiseCard = ({ premise }: Props) => {
  const t = useUiStrings();
  const { data: shorttext, isLoading: shorttextLoading } = useTranslation(
    premise.title
  );
  const { data: longtext, isLoading: longtextLoading } = useTranslation(
    premise.desc
  );

  if (shorttextLoading || longtextLoading)
    return (
      <div className={classes.card}>
        <Loader color="var(--ink)" type="dots" size="lg" />
      </div>
    );

  return (
    <div className={classes.card}>
      <p className={classes.label}>{t("yourBeginning")}</p>
      <p className={classes.title}>{shorttext}</p>
      <Spoiler
        maxHeight={50}
        showLabel={t("showMore")}
        hideLabel={t("hide")}
        className={classes.body}
        classNames={{ control: classes.spoilerControl }}
      >
        {longtext}
      </Spoiler>
      <div className={classes.controls}>
        <ReadController id="card" text={longtext} />
      </div>
    </div>
  );
};

export default PremiseCard;
