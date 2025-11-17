import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import { Button, Slider, Typography, Box, IconButton, Tooltip } from "@mui/material";
import { resetVideo, sendImage, sendVideo } from "../actions";

import "./Video.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faStop,
  faSync,
  faVideo,
  faVideoCamera,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";

function Video() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { user, userId, date, time, image, prediction, minScore, labelSettings, status } =
    useSelector((state) => ({
      ...state.appReducer,
      ...state.videoReducer,
    }));

  // Refs
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const zonesCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timeIntervalRef = useRef(null);

  // State
  const [recording, setRecording] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [framerate, setFramerate] = useState(2);
  const [facingMode, setFacingMode] = useState("environment");
  const [intervalId, setIntervalId] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Check Kafka connection
  useEffect(() => {
    if (status?.kafka === "disconnected") {
      navigate("/photo");
    }
  }, [status, navigate]);

  // Update frame when prediction/image changes
  useEffect(() => {
    setFrame();
  }, [prediction, image]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [intervalId, recordedVideoUrl]);

  // Initialize video stream
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    initializeVideo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const captureFrame = useCallback(() => {
    if (!captureCanvasRef.current || !videoRef.current) return;

    const canvas = captureCanvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const imageData = canvas.toDataURL("image/jpeg");
    const base64data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    const d = new Date();
    dispatch(sendImage(base64data, user?.id, d.toISOString(), d.getTime()));
  }, [dispatch, user]);

  const setFrame = useCallback(() => {
    if (!imageCanvasRef.current || !image) return;

    const canvas = imageCanvasRef.current;
    const imageObj = new Image();
    imageObj.onload = function () {
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
      updateZonesCanvas();
      drawDetections();
    };
    imageObj.src = `data:image/jpeg;base64,${image}`;
  }, [image]);

  const drawDetections = useCallback(() => {
    if (!imageCanvasRef.current?.getContext || !prediction) return;

    prediction.detections
      .filter((d) => d.score > minScore)
      .forEach((d) => drawDetection(d));
  }, [prediction, minScore]);

  const updateZonesCanvas = useCallback(() => {
    if (!zonesCanvasRef.current || !imageCanvasRef.current) return;

    const zonesCanvas = zonesCanvasRef.current;
    const imageCanvas = imageCanvasRef.current;

    zonesCanvas.width = imageCanvas.width;
    zonesCanvas.height = imageCanvas.height;

    const ctx = zonesCanvas.getContext("2d");
    ctx.fillStyle = "#565656";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, zonesCanvas.width, zonesCanvas.height);
  }, []);

  const drawDetection = useCallback(
    ({ box, label, score }) => {
      if (!imageCanvasRef.current) return;

      const canvas = imageCanvasRef.current;
      const drawScore = true;
      const textBgHeight = 14;
      const padding = 2;
      const letterWidth = 7.25;
      const scoreWidth = drawScore ? 4 * letterWidth : 0;
      const text = drawScore ? `${label} ${Math.floor(score * 100)}%` : label;

      const width = Math.floor((box.xMax - box.xMin) * canvas.width);
      const height = Math.floor((box.yMax - box.yMin) * canvas.height);
      const x = Math.floor(box.xMin * canvas.width);
      const y = Math.floor(box.yMin * canvas.height);
      const labelSetting = labelSettings[label] || { bgColor: "#000000" };
      const labelWidth = label.length * letterWidth + scoreWidth + padding * 2;

      drawBox(x, y, width, height, labelSetting.bgColor);
      drawBoxTextBG(x, y + height - textBgHeight, labelWidth, textBgHeight, labelSetting.bgColor);
      drawBoxText(text, x + padding, y + height - padding);
      clearZone(x + 5, y + height - textBgHeight - 4, labelWidth, textBgHeight);
      clearZone(x, y, width, height);
    },
    [labelSettings]
  );

  const drawBox = useCallback((x, y, width, height, color) => {
    if (!imageCanvasRef.current) return;
    const ctx = imageCanvasRef.current.getContext("2d");
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
  }, []);

  const drawBoxTextBG = useCallback((x, y, width, height, color) => {
    if (!imageCanvasRef.current) return;
    const ctx = imageCanvasRef.current.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }, []);

  const drawBoxText = useCallback((text, x, y) => {
    if (!imageCanvasRef.current) return;
    const ctx = imageCanvasRef.current.getContext("2d");
    ctx.font = "12px Mono";
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
  }, []);

  const clearZone = useCallback((x, y, width, height) => {
    if (!zonesCanvasRef.current) return;
    const ctx = zonesCanvasRef.current.getContext("2d");
    ctx.clearRect(x - 3, y - 6, width + 6, height + 6);
  }, []);

  // Start frame-by-frame recording (existing functionality)
  const startRecording = useCallback(() => {
    if (intervalId || !videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (imageCanvasRef.current) {
      imageCanvasRef.current.width = canvas.width;
      imageCanvasRef.current.height = canvas.height;
    }

    const interval = setInterval(() => captureFrame(), Math.ceil(1000 / framerate));
    setIntervalId(interval);
    setRecording(true);
  }, [intervalId, framerate, captureFrame]);

  // Stop frame-by-frame recording
  const stopRecording = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setRecording(false);
  }, [intervalId]);

  // Start video recording (new functionality)
  const startVideoRecording = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      const stream = streamRef.current;
      const options = {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 2500000,
      };

      // Fallback to vp8 if vp9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm;codecs=vp8";
      }

      // Fallback to default if vp8 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordingTime(0);

        // Convert blob to base64 and send to backend
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64video = reader.result;
          const d = new Date();
          dispatch(sendVideo(base64video, user?.id, d.toISOString(), d.getTime()));
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setVideoRecording(true);

      // Update recording time
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100);
    } catch (error) {
      console.error("Error starting video recording:", error);
    }
  }, [dispatch, user]);

  // Stop video recording
  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setVideoRecording(false);
    }
  }, []);

  // Download recorded video
  const downloadVideo = useCallback(() => {
    if (recordedVideoUrl) {
      const a = document.createElement("a");
      a.href = recordedVideoUrl;
      a.download = `object-detection-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [recordedVideoUrl]);

  const onFramerateChange = useCallback(
    (event, newValue) => {
      setFramerate(newValue);
      if (recording && intervalId) {
        clearInterval(intervalId);
        const newInterval = setInterval(() => captureFrame(), Math.ceil(1000 / newValue));
        setIntervalId(newInterval);
      }
    },
    [recording, intervalId, captureFrame]
  );

  const onFacingModeClicked = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
  };

  return (
    <div className="video">
      {/* Camera Preview */}
      {!recording && (
        <div className="camera">
          <div className="img-preview">
            <div className="img-container">
              <video
                className="camera-preview"
                ref={videoRef}
                controls={false}
                autoPlay
                playsInline
                muted
              />
              {videoRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span className="recording-time">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="controls-container">
            <div className="left-button-container button-container">
              <Tooltip title="Switch Camera">
                <IconButton
                  className="choose-camera-button"
                  onClick={onFacingModeClicked}
                  size="large"
                >
                  <FontAwesomeIcon icon={faSync} />
                </IconButton>
              </Tooltip>
            </div>
            <div className="center-button-container button-container">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  className="start-recording-button"
                  onClick={startRecording}
                  disabled={videoRecording}
                >
                  <FontAwesomeIcon icon={faCircle} />
                </Button>
                <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                  Frame Capture
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  className={`video-recording-button ${videoRecording ? "recording" : ""}`}
                  onClick={videoRecording ? stopVideoRecording : startVideoRecording}
                  disabled={recording}
                  color={videoRecording ? "error" : "primary"}
                >
                  <FontAwesomeIcon icon={videoRecording ? faStop : faVideoCamera} />
                </Button>
                <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                  Video Record
                </Typography>
              </Box>
              {recordedVideoUrl && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <Tooltip title="Download Video">
                    <IconButton
                      className="download-button"
                      onClick={downloadVideo}
                      color="primary"
                      size="large"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                    Download
                  </Typography>
                </Box>
              )}
            </div>
            <div className="right-button-container button-container">
              <Link to="/photo">
                <Tooltip title="Photo Mode">
                  <IconButton className="choose-camera-button" size="large">
                    <FontAwesomeIcon icon={faVideo} />
                  </IconButton>
                </Tooltip>
              </Link>
            </div>
          </div>
          {!videoRecording && (
            <div className="framerate-control">
              <Typography variant="body2" gutterBottom>
                Frame Rate: {framerate} fps
              </Typography>
              <Slider
                value={framerate}
                onChange={onFramerateChange}
                min={0.5}
                max={10}
                step={0.5}
                marks
                valueLabelDisplay="auto"
                sx={{ maxWidth: 300 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Object Detection View */}
      {recording && (
        <div className="object-detection">
          <div className="img-preview">
            <div className="img-container">
              <canvas className="image-canvas" ref={imageCanvasRef} />
              <div className="zones overlay">
                <canvas className="zones-canvas" ref={zonesCanvasRef} />
              </div>
            </div>
          </div>
          <div className="controls-container">
            <div className="left-button-container button-container"></div>
            <div className="center-button-container button-container">
              <Button
                variant="contained"
                size="large"
                className="stop-recording-button"
                onClick={stopRecording}
                color="error"
              >
                <FontAwesomeIcon className="stop-icon" icon={faStop} />
              </Button>
            </div>
            <div className="right-button-container button-container"></div>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <div className="capture" style={{ display: "none" }}>
        <canvas className="capture-canvas" ref={captureCanvasRef} />
      </div>
    </div>
  );
}

export default Video;
