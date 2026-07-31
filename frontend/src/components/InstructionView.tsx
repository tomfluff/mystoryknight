/*
 * Entry view: the "paper craft" craft-table (approved mockup
 * .impeccable/variants/v1r-paper-craft.html). Three torn construction-paper
 * sheets, worked through in order, driven by the real stores:
 * session (wake) -> character (drawing or ready-made hero) -> premise.
 * Same mutations and modal contracts as the previous entry view.
 */
import "@fontsource/titan-one";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import { VisuallyHidden } from "@mantine/core";
import { useAdventureStore } from "../stores/adventureStore";
import { initSession, useSessionStore } from "../stores/sessionStore";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import DrawingUploadModal from "./DrawingUploadModal";
import PremiseSelectModal from "./PremiseSelectModal";
import HeroGallery from "./HeroGallery";
import SaySticker from "./SaySticker";
import { useUiStrings } from "../i18n/strings";
import classes from "./InstructionView.module.css";

type TStepState = "current" | "locked" | "done";

const STAR =
  "M12 2l2.9 6 6.6.9-4.8 4.5 1.2 6.5L12 16.8 6.1 19.9l1.2-6.5L2.5 8.9 9.1 8z";

const StarDecor = ({ className }: { className: string }) => (
  <span className={`${classes.decor} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false">
      <path d={STAR} fill="currentColor" />
    </svg>
  </span>
);

const CheckSticker = () => (
  <span className={classes.check} aria-hidden="true">
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
);

/* aria-label + title on the chip itself: at <=420px the visible text is
   display:none, so the padlock must still carry its explanation. The inner
   text is aria-hidden to avoid double announcement. */
const LockChip = ({ label }: { label: string }) => (
  <span
    className={classes.lockChip}
    role="img"
    aria-label={label}
    title={label}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
    <span aria-hidden="true">{label}</span>
  </span>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M3 12h15M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InstructionView = () => {
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const session = useSessionStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();
  const [premiseModal, { open: openPremise, close: closePremise }] =
    useDisclosure();

  const newSession = useMutation({
    mutationKey: ["session"],
    mutationFn: () => {
      return instance.get("/session").then((res) => res.data);
    },
    onSuccess: (data) => {
      initSession(data.data.id);
    },
  });

  const step1: TStepState = session ? "done" : "current";
  const step2: TStepState = character ? "done" : session ? "current" : "locked";
  const step3: TStepState = premise
    ? "done"
    : session && character
    ? "current"
    : "locked";

  const announcement =
    step2 === "current"
      ? t("announceStep2")
      : step3 === "current"
      ? t("announceStep3")
      : "";

  return (
    <>
      {/* The #msk-tear* filters this view references are mounted once by
          PaperFilters in App. */}
      <div className={classes.entry}>
        <div className={classes.grain} aria-hidden="true" />

        {/* No lockup here: the app header carries the only wordmark. The
            stars stay as loose table decoration. */}
        <StarDecor className={classes.decorStar1} />
        <StarDecor className={classes.decorStar2} />
        <StarDecor className={classes.decorStar3} />

        <div className={classes.intro}>
          <h1 className={classes.title}>{t("entryTitle")}</h1>
          <p className={classes.lede}>
            <strong>{t("entryLedeBoss")}</strong> {t("entryLedeRest")}
          </p>
          <p className={classes.tryThis}>
            <SaySticker text={`${t("entryLedeBoss")} ${t("entryLedeRest")}`} />
            <span>{t("sayHint")}</span>
          </p>
        </div>

        <ol className={classes.steps}>
          {/* STEP 1 — wake the storyteller (real /session mutation) */}
          <li
            className={`${classes.step} ${classes.paper} ${classes.stepOne}`}
            data-state={step1}
            aria-current={step1 === "current" ? "step" : undefined}
          >
            <span className={`${classes.tape} ${classes.tapeA}`} aria-hidden="true" />
            <span className={`${classes.tape} ${classes.tapeB}`} aria-hidden="true" />
            <span className={classes.nowTag} aria-hidden="true">
              {t("nowTag")}
            </span>
            <div className={classes.stepHead}>
              <span className={classes.num} aria-hidden="true">
                1
              </span>
              <div className={classes.stepHeadText}>
                <h2 className={classes.stepTitle}>{t("step1Title")}</h2>
                <p className={classes.summary}>{session ? t("step1Done") : ""}</p>
              </div>
              <CheckSticker />
            </div>
            <div className={classes.bodyWrap}>
              <div className={classes.body}>
                <div className={classes.bodyInner}>
                  <div className={classes.sayline}>
                    <SaySticker text={t("step1Body")} />
                    <p>{t("step1Body")}</p>
                  </div>
                  <button
                    type="button"
                    className={classes.stickerBtn}
                    onClick={() => newSession.mutate()}
                    disabled={newSession.isPending || session != null}
                  >
                    <svg
                      className={newSession.isPending ? classes.spin : undefined}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={STAR} fill="#FFF6E9" />
                    </svg>
                    <span>
                      {newSession.isPending ? t("wakingButton") : t("wakeButton")}
                    </span>
                  </button>
                  <p className={classes.note} role="status">
                    {newSession.isPending ? t("wakeNoteWaking") : t("wakeNoteIdle")}
                  </p>
                  {newSession.isError && (
                    <p className={classes.errorNote} role="alert">
                      {t("wakeFailed")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>

          {/* STEP 2 — bring your hero (camera modal or ready-made gallery) */}
          <li
            className={`${classes.step} ${classes.paper} ${classes.stepTwo}`}
            data-state={step2}
            aria-current={step2 === "current" ? "step" : undefined}
          >
            <span className={`${classes.tape} ${classes.tapeA}`} aria-hidden="true" />
            <span className={`${classes.tape} ${classes.tapeB}`} aria-hidden="true" />
            <span className={classes.nowTag} aria-hidden="true">
              {t("nowTag")}
            </span>
            <div className={classes.stepHead}>
              <span className={classes.num} aria-hidden="true">
                2
              </span>
              <div className={classes.stepHeadText}>
                <h2 className={classes.stepTitle}>{t("step2Title")}</h2>
                <p className={classes.summary}>
                  {character
                    ? t("step2Done").replace("{name}", character.fullname)
                    : ""}
                </p>
              </div>
              <LockChip label={t("opensAfterStep1")} />
              <CheckSticker />
            </div>
            <div className={classes.bodyWrap}>
              <div className={classes.body}>
                <div className={classes.bodyInner}>
                  <div className={classes.sayline}>
                    <SaySticker text={t("step2Body")} />
                    <p>{t("step2Body")}</p>
                  </div>
                  <button
                    type="button"
                    className={`${classes.stickerBtn} ${classes.camBtn}`}
                    onClick={openCapture}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.2"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" />
                      <circle cx="12" cy="13.5" r="3.5" />
                    </svg>
                    <span>{t("snapDrawing")}</span>
                  </button>
                  <HeroGallery />
                </div>
              </div>
            </div>
          </li>

          {/* STEP 3 — choose where it begins (premise modal) */}
          <li
            className={`${classes.step} ${classes.paper} ${classes.stepThree}`}
            data-state={step3}
            aria-current={step3 === "current" ? "step" : undefined}
          >
            <span className={`${classes.tape} ${classes.tapeA}`} aria-hidden="true" />
            <span className={`${classes.tape} ${classes.tapeB}`} aria-hidden="true" />
            <span className={classes.nowTag} aria-hidden="true">
              {t("nowTag")}
            </span>
            <div className={classes.stepHead}>
              <span className={classes.num} aria-hidden="true">
                3
              </span>
              <div className={classes.stepHeadText}>
                <h2 className={classes.stepTitle}>{t("step3Title")}</h2>
              </div>
              <LockChip label={t("opensAfterStep2")} />
              <CheckSticker />
            </div>
            <div className={classes.bodyWrap}>
              <div className={classes.body}>
                <div className={classes.bodyInner}>
                  <div className={classes.sayline}>
                    <SaySticker text={t("step3Body")} />
                    <p>{t("step3Body")}</p>
                  </div>
                  <button
                    type="button"
                    className={classes.stickerBtn}
                    onClick={openPremise}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d={STAR} fill="#FFF6E9" />
                    </svg>
                    <span>{t("pickBeginning")}</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ol>

        {/* Interactivity teaser: every page ends with a choice */}
        <section className={classes.steer} aria-labelledby="entry-steer-h">
          <h2 className={classes.matH2} id="entry-steer-h">
            {t("steerTitle")}
          </h2>
          <p className={classes.matLede}>{t("steerLede")}</p>

          <div className={classes.steerBoard}>
            <div className={`${classes.moment} ${classes.paper}`}>
              <div className={classes.sayline}>
                <SaySticker text={t("steerMoment")} />
                <p>{t("steerMoment")}</p>
              </div>
            </div>
            <svg
              className={classes.split}
              viewBox="0 0 190 38"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M95 2C95 15 45 19 26 36M95 2c0 13 50 17 69 34"
                stroke="#FFF6E9"
                strokeWidth="3"
                strokeDasharray="1 9"
                strokeLinecap="round"
                fill="none"
                opacity=".75"
              />
            </svg>
            <div className={classes.branch}>
              <div className={`${classes.fork} ${classes.paper} ${classes.forkA}`}>
                <span>{t("steerForkA")}</span>
                <ArrowIcon />
              </div>
              <div className={`${classes.fork} ${classes.paper} ${classes.forkB}`}>
                <span>{t("steerForkB")}</span>
                <ArrowIcon />
              </div>
            </div>
            <p className={classes.steerCap}>{t("steerCap")}</p>
          </div>

          <div className={classes.steerRow}>
            <div className={`${classes.chatScrap} ${classes.paper}`}>
              <p className={classes.chatLabel}>{t("chatLabel")}</p>
              <p className={classes.chatMsg}>{t("chatMsg")}</p>
              <p className={classes.chatReply}>{t("chatReply")}</p>
            </div>
            <div className={classes.endWrap}>
              <span className={classes.endSticker} aria-hidden="true">
                {t("theEnd")}
              </span>
              <p className={classes.endCap}>{t("endCap")}</p>
            </div>
          </div>
        </section>

        <VisuallyHidden component="p" role="status">
          {announcement}
        </VisuallyHidden>
      </div>

      <DrawingUploadModal display={captureModal} finalAction={closeCapture} />
      <PremiseSelectModal
        character={character}
        display={premiseModal}
        finalAction={closePremise}
      />
    </>
  );
};

export default InstructionView;
