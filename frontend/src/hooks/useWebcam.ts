/*
 * Custom hook to use webcam and capture content.
 * It returns the webcamRef and the base64Capture.
 *
 * @example
 * const { webcamRef, base64Capture, captureWebcam } = useWebcam();
 * <Webcam ref={webcamRef} />
 * <button onClick={() => captureWebcam()}>Capture</button>
 *
 */
import { useCallback, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";

// `preferBack`: on phones, default to the rear camera (photographing a drawing)
// rather than the selfie camera. Desktop labels never match, so it is a no-op there.
const useWebcam = (preferBack = false) => {
  const webcamRef = useRef<Webcam>(null);
  const [base64Capture, setBase64Capture] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  // Without this a blocked or missing camera leaves the modal showing
  // "Detecting cameras..." over a black void forever, with no explanation.
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    const name = typeof err === "string" ? err : err.name;
    setCameraError(
      name === "NotAllowedError"
        ? "Camera access was blocked. Allow the camera in your browser, then reopen this window."
        : name === "NotFoundError" || name === "OverconstrainedError"
        ? "No camera found. Connect a camera and reopen this window."
        : "The camera could not be started. Check that no other app is using it."
    );
  }, []);

  // Device labels are empty until the user grants camera permission, so call
  // this from <Webcam onUserMedia>, not on mount.
  const refreshDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const cameras = all.filter((d) => d.kind === "videoinput");
    setDevices(cameras);
    const preferred =
      (preferBack && cameras.find((d) => /back|rear|environment/i.test(d.label))) ||
      cameras[0];
    // Keep an explicit choice; otherwise default to whatever the browser opened.
    setDeviceId((current) => current ?? preferred?.deviceId ?? null);
  }, [preferBack]);

  // `deviceId` must be `exact`, otherwise it is only a hint and the browser is
  // free to ignore it and keep the camera it already opened.
  const videoConstraints = useMemo(
    () => (deviceId ? { deviceId: { exact: deviceId } } : undefined),
    [deviceId]
  );

  // Capture photo from webcam
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const captured = webcamRef.current.getScreenshot();
      setBase64Capture(captured);
      return captured;
    }
  }, [webcamRef]);

  const clear = useCallback(() => {
    setBase64Capture(null);
  }, []);

  return {
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
  };
};

export default useWebcam;
