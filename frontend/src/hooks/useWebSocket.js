import { useEffect, useRef, useState, useCallback } from "react";
import { useWebcamStore } from "../store/useWebcamStore";
import { useAuthStore } from "../store/useAuthStore";

export const useWebSocket = () => {
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  const {
    isWsConnected,
    setWsConnected,
    setFaces,
    setLatency,
    isCountdownRunning,
    addCapturedRecord,
  } = useWebcamStore();

  const getWsUrl = () => {
    let wsUrl = import.meta.env.VITE_WS_URL || "";
    
    // Normalize localhost to 127.0.0.1 to avoid Windows IPv6 uvicorn binding issue
    if (wsUrl.includes("localhost")) {
      wsUrl = wsUrl.replace("localhost", "127.0.0.1");
    }

    if (wsUrl) {
      if (!wsUrl.endsWith("/ws/detect")) {
        wsUrl = wsUrl.replace(/\/$/, "");
        wsUrl = `${wsUrl}/ws/detect`;
      }
      return wsUrl;
    }

    // Dynamically derive from VITE_API_URL or default to localhost
    let apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    if (apiBase.includes("localhost")) {
      apiBase = apiBase.replace("localhost", "127.0.0.1");
    }

    try {
      const url = new URL(apiBase);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = url.host;
      return `${protocol}//${wsHost}/ws/detect`;
    } catch (err) {
      // Fallback
      return "ws://127.0.0.1:8000/ws/detect";
    }
  };

  const optionsRef = useRef({});

  const connect = useCallback((options = {}) => {
    if (socketRef.current || isConnectingRef.current) return;

    if (Object.keys(options).length > 0) {
      optionsRef.current = options;
    }

    isConnectingRef.current = true;
    const wsUrl = getWsUrl();
    const token = useAuthStore.getState().token;
    
    const params = new URLSearchParams();
    if (token) {
      params.append("token", token);
    }
    
    const activeOpts = optionsRef.current;
    if (activeOpts.session_type) {
      params.append("session_type", activeOpts.session_type);
    }
    if (activeOpts.script_text) {
      params.append("script_text", activeOpts.script_text);
    }

    const queryString = params.toString();
    const fullUrl = queryString ? `${wsUrl}?${queryString}` : wsUrl;

    console.log("[WS] Connecting to:", fullUrl);

    try {
      const ws = new WebSocket(fullUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connection established successfully");
        setWsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error("[WS] Server error message received:", data.message);
            setError(data.message);
            return;
          }

          const facesData = data.faces || [];
          setFaces(facesData);
          if (data.processing_time_ms !== undefined) {
            setLatency(data.processing_time_ms);
          }

          // Persist details if capturing session is active
          const webcamState = useWebcamStore.getState();
          if (webcamState.isCountdownRunning && facesData.length > 0) {
            facesData.forEach((face) => {
              webcamState.addCapturedRecord({
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
        } catch (err) {
          console.error("[WS] Error parsing incoming WS packet:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[WS] WebSocket exception encountered:", err);
        setError("WebSocket server is unreachable or refused handshake");
        setWsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(`[WS] Connection closed. Code=${event.code}, Reason=${event.reason || "None"}`);
        setWsConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;

        // Auto-reconnect if token invalidity wasn't the closure cause (FastAPI code 4001)
        if (event.code !== 4001 && !reconnectTimeoutRef.current) {
          console.log("[WS] Scheduling auto-reconnection in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 5000);
        } else if (event.code === 4001) {
          setError("Session expired or invalid authentication token");
        }
      };
    } catch (err) {
      console.error("[WS] Initial socket setup failed:", err);
      setError("Setup failed: " + err.message);
      setWsConnected(false);
      isConnectingRef.current = false;
    }
  }, [isCountdownRunning, setFaces, setLatency, setWsConnected, addCapturedRecord]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      console.log("[WS] Disconnecting socket manually");
      // Close socket cleanly
      socketRef.current.close(1000, "Manually disconnected");
      socketRef.current = null;
    }
    setWsConnected(false);
    isConnectingRef.current = false;
  }, [setWsConnected]);

  const sendFrame = useCallback((base64Image) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        image: base64Image,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
      }
    };
  }, []);

  return {
    isWsConnected,
    error,
    connect,
    disconnect,
    sendFrame,
  };
};
