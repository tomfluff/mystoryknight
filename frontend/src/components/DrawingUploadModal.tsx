import useWebcam from "../hooks/useWebcam";
import {
  Grid,
  Stack,
  Button,
  Container,
  Image,
  Modal,
  Loader,
  Select,
} from "@mantine/core";
import { lazy, Suspense } from "react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { setCharacter } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useUiStrings } from "../i18n/strings";
import paper from "./paperChrome.module.css";
import world from "./paper.module.css";

// Lazy: react-webcam only loads when the capture modal actually renders the
// camera, keeping it out of the initial bundle.
const Webcam = lazy(() => import("react-webcam"));

type Props = {
  display: boolean;
  finalAction: () => void;
};

const DrawingUploadModal = ({ display, finalAction }: Props) => {
  const {
    webcamRef,
    base64Capture,
    capture,
    clear,
    devices,
    deviceId,
    setDeviceId,
    refreshDevices,
    videoConstraints,
    cameraError,
    handleUserMediaError,
  } = useWebcam(true);
  const [click, { toggle: toggleClick }] = useDisclosure(false);
  const instance = getAxiosInstance();
  const t = useUiStrings();
  const isMobile = useMediaQuery("(max-width: 48em)");

  const uploadImage = useMutation({
    mutationKey: ["webcam"],
    mutationFn: (capture: string) => {
      return instance
        .post("/character", createCallContext({ image: capture, type: "jpeg" }))
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      const id = data.data.id;
      const image = data.data.image;
      const character = data.data.character;
      setCharacter(id, image, character);
      clear();
      finalAction();
    },
  });

  const handleCapture = () => {
    capture();
    toggleClick();
  };

  const handleRetake = () => {
    clear();
    toggleClick();
  };

  const handleSend = () => {
    if (!base64Capture) return;
    uploadImage.mutate(base64Capture);
  };

  return (
    <Modal
      size="lg"
      opened={display}
      onClose={finalAction}
      title={t("captureDrawingTitle")}
      centered
      fullScreen={isMobile}
      closeOnEscape={!uploadImage.isPending}
      withCloseButton={!uploadImage.isPending}
      closeOnClickOutside={!uploadImage.isPending}
      closeButtonProps={{ "aria-label": t("closeWindow") }}
      classNames={{
        overlay: paper.overlay,
        content: `${paper.content} ${paper.sheetGrass}`,
        header: paper.header,
        title: paper.title,
        body: paper.body,
        close: paper.close,
      }}
    >
      <Container>
        <Stack>
          {!click && (
            <Select
              size="md"
              data={devices.map((device, i) => ({
                value: device.deviceId,
                label: device.label || `${t("camera")} ${i + 1}`,
              }))}
              value={deviceId}
              onChange={(value) => value && setDeviceId(value)}
              placeholder={
                devices.length === 0
                  ? t("detectingCameras")
                  : t("selectCamera")
              }
              allowDeselect={false}
              disabled={devices.length === 0}
              classNames={{
                wrapper: paper.fieldWrapper,
                input: paper.fieldInput,
                section: paper.fieldSection,
                dropdown: paper.dropdown,
                option: paper.option,
              }}
            />
          )}
          {/* Plain <p>: the world's error chip paints its own colour, and a
              Mantine Text would layer --text-color back over it. */}
          {!click && cameraError && (
            <p className={world.errorChip} role="alert">
              {t(cameraError)}
            </p>
          )}
          {/* One framed slot at a reserved 4:3 for all three media states, so
              the buttons under it do not jump between loader, camera and
              capture. */}
          {(click ? !!base64Capture : !cameraError) && (
            <div className={paper.frameMedia}>
              {!click && (
                <Suspense fallback={<Loader className={paper.loaderInk} />}>
                  <Webcam
                    ref={webcamRef}
                    videoConstraints={videoConstraints}
                    onUserMedia={refreshDevices}
                    onUserMediaError={handleUserMediaError}
                  />
                </Suspense>
              )}
              {click && base64Capture && (
                <Image src={base64Capture} alt={t("capturedDrawingAlt")} />
              )}
            </div>
          )}
          <Grid>
            {click && (
              <Grid.Col span={8}>
                <Button
                  onClick={handleSend}
                  disabled={uploadImage.isPending}
                  fullWidth
                  h={44}
                  classNames={{ root: paper.btn }}
                >
                  {uploadImage.isPending ? (
                    <Loader
                      className={paper.loaderCream}
                      type="dots"
                      size="md"
                    />
                  ) : (
                    t("send")
                  )}
                </Button>
              </Grid.Col>
            )}
            {click && (
              <Grid.Col span={4}>
                {/* fibre sticker, not a second poppy one: Send is the
                    primary and width alone was the only hierarchy cue */}
                <Button
                  onClick={handleRetake}
                  disabled={uploadImage.isPending}
                  fullWidth
                  h={44}
                  classNames={{ root: paper.btnQuiet }}
                >
                  {t("retake")}
                </Button>
              </Grid.Col>
            )}
            {!click && (
              <Grid.Col span={12}>
                <Button
                  onClick={handleCapture}
                  fullWidth
                  h={44}
                  disabled={!!cameraError}
                  classNames={{ root: paper.btnGo }}
                >
                  {t("capture")}
                </Button>
              </Grid.Col>
            )}
          </Grid>
          {uploadImage.isError && (
            <p className={world.errorChip} role="alert">
              {t("uploadFailed")}
            </p>
          )}
        </Stack>
      </Container>
    </Modal>
  );
};

export default DrawingUploadModal;
