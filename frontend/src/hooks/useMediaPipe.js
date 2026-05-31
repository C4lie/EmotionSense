import { useEffect, useRef, useState, useCallback } from "react";

export const useMediaPipe = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const faceMeshRef = useRef(null);
  const poseRef = useRef(null);

  // Computed results state
  const [telemetry, setTelemetry] = useState({
    eyeContact: 85, // default starting/fallback values
    postureScore: 80,
    shoulderTilt: 0,
    headTilt: 0,
  });

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    let active = true;

    const initModels = async () => {
      try {
        // Load MediaPipe scripts dynamically from jsDelivr CDN
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

        if (!active) return;

        // Verify window globals
        if (window.FaceMesh && window.Pose) {
          // Initialize Face Mesh
          const fm = new window.FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });
          fm.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          fm.onResults((results) => {
            if (!active) return;
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0];
              
              // Eye contact logic using iris keypoints (e.g. 468-477 range in MediaPipe)
              // Left iris center = 468, Right iris center = 473
              const leftIris = landmarks[468];
              const rightIris = landmarks[473];
              const leftEyeCenter = landmarks[159]; // approximate eye center
              const rightEyeCenter = landmarks[386];

              if (leftIris && rightIris && leftEyeCenter && rightEyeCenter) {
                // Calculate alignment offset
                const dxL = Math.abs(leftIris.x - leftEyeCenter.x);
                const dyL = Math.abs(leftIris.y - leftEyeCenter.y);
                const dxR = Math.abs(rightIris.x - rightEyeCenter.x);
                
                const avgOffset = (dxL + dyL + dxR) / 3.0;
                
                // Normalise alignment: higher offset = looking away
                const contactPct = Math.round(Math.max(10, Math.min(100, 100 - (avgOffset * 1500))));
                
                // Head tilt (rotation in radians)
                const leftCorner = landmarks[130];
                const rightCorner = landmarks[359];
                const headTilt = rightCorner && leftCorner 
                  ? Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x)
                  : 0;

                setTelemetry((prev) => ({
                  ...prev,
                  eyeContact: contactPct,
                  headTilt: headTilt,
                }));
              }
            }
          });

          faceMeshRef.current = fm;

          // Initialize Pose
          const ps = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });
          ps.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          ps.onResults((results) => {
            if (!active) return;
            if (results.poseLandmarks) {
              const landmarks = results.poseLandmarks;
              // Left shoulder = 11, Right shoulder = 12
              const leftShoulder = landmarks[11];
              const rightShoulder = landmarks[12];

              if (leftShoulder && rightShoulder) {
                // Calculate shoulder tilt angle
                const dx = rightShoulder.x - leftShoulder.x;
                const dy = rightShoulder.y - leftShoulder.y;
                const angle = Math.atan2(dy, dx);
                const tiltPct = Math.min(30, Math.abs(angle * (180 / Math.PI)));
                
                // Posture consistency score based on shoulder tilt and horizontal stability
                const posture = Math.round(Math.max(10, 100 - (tiltPct * 3.0)));

                setTelemetry((prev) => ({
                  ...prev,
                  postureScore: posture,
                  shoulderTilt: angle,
                }));
              }
            }
          });

          poseRef.current = ps;
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
      }
    };

    initModels();

    return () => {
      active = false;
      if (faceMeshRef.current) faceMeshRef.current.close();
      if (poseRef.current) poseRef.current.close();
    };
  }, []);

  const analyzeFrame = useCallback(async (videoElement) => {
    if (!isLoaded) return;
    try {
      if (faceMeshRef.current && videoElement.readyState >= 2) {
        await faceMeshRef.current.send({ image: videoElement });
      }
      if (poseRef.current && videoElement.readyState >= 2) {
        await poseRef.current.send({ image: videoElement });
      }
    } catch {
      // Slient fail frame errors to prevent loop interruptions
    }
  }, [isLoaded]);

  return {
    isLoaded,
    telemetry,
    analyzeFrame,
  };
};

export default useMediaPipe;
