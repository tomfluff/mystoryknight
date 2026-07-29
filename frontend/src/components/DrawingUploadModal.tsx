import useWebcam from "../hooks/useWebcam";
import {
  Text,
  Grid,
  Stack,
  Button,
  Container,
  Image,
  Modal,
  Loader,
  Select,
} from "@mantine/core";
import Webcam from "react-webcam";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { setCharacter } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";

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
  } = useWebcam(true);
  const [click, { toggle: toggleClick }] = useDisclosure(false);
  const instance = getAxiosInstance();
  const isMobile = useMediaQuery("(max-width: 50em)");

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
      title="Capture Drawing"
      centered
      fullScreen={isMobile}
      closeOnEscape={!uploadImage.isPending}
      withCloseButton={!uploadImage.isPending}
      closeOnClickOutside={!uploadImage.isPending}
    >
      <Container>
        <Stack>
          {!click && (
            <Select
              data={devices.map((device, i) => ({
                value: device.deviceId,
                label: device.label || `Camera ${i + 1}`,
              }))}
              value={deviceId}
              onChange={(value) => value && setDeviceId(value)}
              placeholder={
                devices.length === 0 ? "Detecting cameras…" : "Select camera"
              }
              allowDeselect={false}
              disabled={devices.length === 0}
            />
          )}
          {!click && (
            <Webcam
              ref={webcamRef}
              videoConstraints={videoConstraints}
              onUserMedia={refreshDevices}
            />
          )}
          {click && base64Capture && (
            <Image src={base64Capture} alt="placeholder" />
          )}
          <Grid>
            {click && (
              <Grid.Col span={8}>
                <Button
                  onClick={handleSend}
                  disabled={uploadImage.isPending}
                  fullWidth
                >
                  {uploadImage.isPending ? (
                    <Loader color="gray" type="dots" size="md" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </Grid.Col>
            )}
            {click && (
              <Grid.Col span={4}>
                <Button
                  onClick={handleRetake}
                  disabled={uploadImage.isPending}
                  fullWidth
                >
                  Retake
                </Button>
              </Grid.Col>
            )}
            {!click && (
              <Grid.Col span={12}>
                <Button onClick={handleCapture} fullWidth>
                  Capture
                </Button>
              </Grid.Col>
            )}
          </Grid>
          {uploadImage.isError && (
            <Text c="red">{uploadImage.error.message}</Text>
          )}
        </Stack>
      </Container>
    </Modal>
  );
};

export default DrawingUploadModal;
