import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button, IconButton, Tooltip } from "@mui/material";
import { resetSearch, searchPhoto } from "../actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faSync,
  faVideoSlash,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";

import "./Photo.scss";

function Photo() {
  const dispatch = useDispatch();

  // Redux state
  const {
    predictionPending,
    predictionResponse,
    prediction,
    predictionError,
    minScore,
    labelSettings,
    status,
  } = useSelector((state) => ({
    ...state.appReducer,
    ...state.photoReducer,
  }));

  // Refs
  const videoRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const zonesCanvasRef = useRef(null);
  const streamRef = useRef(null);

  // State
  const [image, setImage] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");

  // Initialize camera
  useEffect(() => {
    if (cameraEnabled && !image) {
      initializeCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraEnabled, image, facingMode]);

  // Draw detections when prediction changes
  useEffect(() => {
    drawDetections();
  }, [prediction]);

  const initializeCamera = useCallback(async () => {
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
  }, [facingMode]);

  const enableCamera = useCallback(() => {
    setCameraEnabled(true);
    setImage(null);
    dispatch(resetSearch());
  }, [dispatch]);

  const onCameraToggled = useCallback(() => {
    enableCamera();
  }, [enableCamera]);

  const onCameraClicked = useCallback(() => {
    if (!videoRef.current || !imageCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = imageCanvasRef.current;

    setVideoWidth(video.videoWidth);
    setVideoHeight(video.videoHeight);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => track.stop());
    }

    setImage(canvas.toDataURL());
    setCameraEnabled(false);
    updateZonesCanvas();

    const imageData = canvas.toDataURL("image/jpeg");
    const base64data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    dispatch(searchPhoto(base64data));
  }, [dispatch]);

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

  const drawDetections = useCallback(() => {
    if (!prediction || !prediction.detections || !imageCanvasRef.current?.getContext) {
      return;
    }

    prediction.detections.filter((d) => d.score > minScore).forEach((d) => drawDetection(d));
  }, [prediction, minScore]);

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

  const onFacingModeClicked = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const renderCamera = () => {
    const displayVideoToggle = status?.kafka === "connected" ? {} : { display: "none" };

    if (!cameraEnabled || image) {
      return null;
    }

    return (
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
            <div className="horizontal overlay">
              {/*<HorizontalCameraBorder className={"horizontal-camera-border-svg"} />*/}
            </div>
            <div className="vertical overlay">
              {/*<VerticalCameraBorder className={"vertical-camera-border-svg"} />*/}
            </div>
          </div>
        </div>
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
          <Button
            variant="contained"
            size="large"
            className="take-picture-button"
            onClick={onCameraClicked}
          >
            <FontAwesomeIcon icon={faCircle} />
          </Button>
        </div>
        <div className="right-button-container button-container">
          <Link to="/video" style={displayVideoToggle}>
            <Tooltip title="Video Mode">
              <IconButton className="choose-camera-button" size="large">
                <FontAwesomeIcon icon={faVideoSlash} />
              </IconButton>
            </Tooltip>
          </Link>
        </div>
      </div>
    );
  };

  const renderSnapshot = () => {
    const displayResult = image ? {} : { display: "none" };
    const displayButtons = predictionPending ? { display: "none" } : {};
    const displayLoading = predictionPending ? {} : { display: "none" };

    const displayError =
      !predictionPending && predictionError
        ? { width: `${videoWidth}px`, height: `${videoHeight}px` }
        : { display: "none" };

    const displayImage =
      !predictionPending && !predictionError && prediction ? {} : { display: "none" };

    let displayNoObjects;
    if (
      !predictionPending &&
      prediction &&
      (!prediction.detections || prediction.detections.length === 0)
    ) {
      displayNoObjects = {};
    } else {
      displayNoObjects = { display: "none" };
    }

    return (
      <div className="result" style={displayResult}>
        <div className="img-preview">
          <div className="error-container" style={displayError}>
            <h2>
              <FontAwesomeIcon className="error-icon" icon={faExclamationCircle} /> Error
            </h2>
            <code>{JSON.stringify(predictionError, null, 2)}</code>
          </div>
          <div className="img-container" style={displayImage}>
            <canvas className="result-canvas" ref={imageCanvasRef} />
            <div className="zones overlay">
              <canvas className="zones-canvas" ref={zonesCanvasRef} />
            </div>
            <div className="loading overlay" style={displayLoading}>
              <div>
                <FontAwesomeIcon className="loading-icon" icon={faCircleNotch} spin />
              </div>
              <div className="loading-text">Loading ...</div>
            </div>
            <div className="no-objects overlay" style={displayNoObjects}>
              <div className="no-objects-text">No Objects</div>
              <div className="no-objects-text">Found</div>
            </div>
          </div>
        </div>
        <div className="left-button-container button-container" style={displayButtons}></div>
        <div className="center-button-container button-container" style={displayButtons}>
          <Button
            variant="contained"
            size="large"
            className="re-take-picture-button"
            onClick={onCameraToggled}
          >
            <span className="label-word">Try</span>
            <span className="label-word">again</span>
          </Button>
        </div>
        <div className="right-button-container button-container" style={displayButtons}></div>
      </div>
    );
  };

  return (
    <div className="photo">
      {renderCamera()}
      {renderSnapshot()}
    </div>
  );
}

export default Photo;
