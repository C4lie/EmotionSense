import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useWebcamStore } from "../../store/useWebcamStore";
import { detectService } from "../../services/detectService";
import { Loader } from "../../components/ui/Loader";
import { Camera, CameraOff, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";

export const WebcamFeed = ({ sessionType = "live", scriptText = "" }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const isProcessingRef = useRef(false);

  const {
    faces,
    isDetecting,
    selectedDeviceId,
    resolution,
    targetFps,
    compressionQuality,
    setFaces,
    setLatency,
    isCountdownRunning,
    addCapturedRecord,
  } = useWebcamStore();

  const {
    isWsConnected,
    connect: wsConnect,
    disconnect: wsDisconnect,
    sendFrame: wsSendFrame,
  } = useWebSocket();

  const [hasPermission, setHasPermission] = useState(null);
  const [devices, setDevices] = useState([]);

  // Detect camera devices & check permissions
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setHasPermission(false);
      return;
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then((deviceInfos) => {
        const videoDevices = deviceInfos.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      })
      .catch((err) => {
        console.error("Error listing devices:", err);
        setHasPermission(false);
      });
  }, []);

  // Compression helper
  const compressFrame = (imageSrc, width = 480, height = 360, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas blob conversion failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = imageSrc;
    });
  };

  // Compression helper for WebSockets (Base64 JPEG representation)
  const compressFrameBase64 = (imageSrc, width = 480, height = 360, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = imageSrc;
    });
  };

  // Connect/disconnect WebSocket based on detection state
  useEffect(() => {
    if (isDetecting) {
      wsConnect({ session_type: sessionType, script_text: scriptText });
    } else {
      wsDisconnect();
    }
  }, [isDetecting, wsConnect, wsDisconnect, sessionType, scriptText]);

  // Main Detection Loop
  useEffect(() => {
    if (!isDetecting) {
      setFaces([]);
      setLatency(0);
      if (loopRef.current) {
        clearTimeout(loopRef.current);
        loopRef.current = null;
      }
      return;
    }

    const processFrame = async () => {
      if (!isDetecting || !webcamRef.current) return;
      if (isProcessingRef.current) return;

      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        // Retry capture on next frame tick
        loopRef.current = setTimeout(processFrame, 1000 / targetFps);
        return;
      }

      isProcessingRef.current = true;
      const tStart = performance.now();

      try {
        if (isWsConnected) {
          // WebSocket Mode: stream frame to WS server
          const base64 = await compressFrameBase64(
            screenshot,
            480,
            360,
            compressionQuality
          );
          wsSendFrame(base64);
        } else {
          // HTTP Polling Fallback Mode
          const compressedBlob = await compressFrame(
            screenshot,
            480,
            360,
            compressionQuality
          );

          // API detection call
          const response = await detectService.detectImage(compressedBlob, false);
          
          if (response.success) {
            const facesData = response.faces || [];
            setFaces(facesData);
            setLatency(Math.round(performance.now() - tStart));

            // Capture face details if session is active
            if (isCountdownRunning && facesData.length > 0) {
              facesData.forEach((face) => {
                addCapturedRecord({
                  timestamp: new Date().toISOString(),
                  face_index: face.face_index,
                  box_x: face.box.x,
                  box_y: face.box.y,
                  box_w: face.box.width,
                  box_h: face.box.height,
                  dominant_emotion: face.dominant_emotion,
                  confidence: face.confidence,
                  happy: face.emotion_scores.happy,
                  sad: face.emotion_scores.sad,
                  angry: face.emotion_scores.angry,
                  neutral: face.emotion_scores.neutral,
                  fear: face.emotion_scores.fear,
                  surprise: face.emotion_scores.surprise,
                  disgust: face.emotion_scores.disgust,
                });
              });
            }
          }
        }
      } catch (err) {
        console.error("[WebcamFeed] Detection error:", err);
      } finally {
        isProcessingRef.current = false;
        // Schedule next processing iteration based on FPS target
        if (isDetecting) {
          loopRef.current = setTimeout(processFrame, 1000 / targetFps);
        }
      }
    };

    processFrame();

    return () => {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
        loopRef.current = null;
      }
    };
  }, [isDetecting, targetFps, compressionQuality, isWsConnected, wsSendFrame, setFaces, setLatency, isCountdownRunning, addCapturedRecord]);

  // Canvas drawing effect: sync with bounding box updates
  useEffect(() => {
    const canvas = canvasRef.current;
    const webcam = webcamRef.current;
    if (!canvas || !webcam) return;

    const ctx = canvas.getContext("2d");
    const video = webcam.video;
    if (!video) return;

    // Set canvas dimensions to match the display size of the video element
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current faces list from useWebcamStore
    faces.forEach((face) => {
      // Bounding coordinates relative to the compressed width/height (480x360)
      const scaleX = canvas.width / 480;
      const scaleY = canvas.height / 360;

      const x = face.box.x * scaleX;
      const y = face.box.y * scaleY;
      const w = face.box.width * scaleX;
      const h = face.box.height * scaleY;

      // Select color based on dominant emotion
      let boxColor = "#10b981"; // neutral/happy = emerald
      if (face.dominant_emotion === "angry") boxColor = "#ef4444"; // red
      else if (face.dominant_emotion === "sad") boxColor = "#3b82f6"; // blue
      else if (face.dominant_emotion === "fear") boxColor = "#8b5cf6"; // purple
      else if (face.dominant_emotion === "surprise") boxColor = "#f59e0b"; // amber

      // Draw bounding box
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.strokeRect(x, y, w, h);

      // Draw dominant emotion label and confidence percentage
      const labelText = `${face.dominant_emotion.toUpperCase()} (${Math.round(
        face.confidence
      )}%)`;
      ctx.font = "bold 11px Inter, sans-serif";
      
      // Label box padding
      const labelWidth = ctx.measureText(labelText).width + 8;
      ctx.fillStyle = boxColor;
      ctx.fillRect(x - 0.75, y - 20, labelWidth, 20);

      // Text color
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, x + 4, y - 6);
    });
  }, [faces]);

  // Request Animation Frame loop to sync canvas dimensions when window resizes
  useEffect(() => {
    let active = true;
    const syncDimensions = () => {
      const canvas = canvasRef.current;
      const webcam = webcamRef.current;
      if (canvas && webcam && webcam.video) {
        const rect = webcam.video.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }
      if (active) requestAnimationFrame(syncDimensions);
    };

    requestAnimationFrame(syncDimensions);
    return () => {
      active = false;
    };
  }, []);

  const videoConstraints = {
    width: resolution.width,
    height: resolution.height,
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
  };

  if (hasPermission === false) {
    const isInsecureContext = !window.isSecureContext;
    return (
      <div className="flex flex-col items-center justify-center h-[360px] bg-zinc-950 rounded-xl border border-dashed border-zinc-800 p-6 text-center">
        <CameraOff className="h-12 w-12 text-destructive mb-3" />
        <h4 className="text-lg font-medium text-destructive">
          {isInsecureContext ? "Insecure Context Blocked" : "Camera Access Denied"}
        </h4>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          {isInsecureContext 
            ? "Your browser blocks camera access over insecure HTTP connections. Please access via localhost or an HTTPS URL." 
            : "Please check your browser settings and grant camera access permissions to begin detection."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-sm">
      {hasPermission === null ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader text="Initializing camera..." size="lg" />
        </div>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            onUserMedia={() => setHasPermission(true)}
            onUserMediaError={() => setHasPermission(false)}
          />
          {/* Connection status badge */}
          {isDetecting && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border border-zinc-805 bg-zinc-900 shadow-sm">
              {isWsConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">WebSocket Stream</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-400">HTTP Polling</span>
                </>
              )}
            </div>
          )}
          {/* Overlay canvas for futuristic face markers */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />

          {!isDetecting && (
            <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center z-10">
              <Camera className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Inference Idle
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle "Start Detection" in the controls to analyze feed.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
