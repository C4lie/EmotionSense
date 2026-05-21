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
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    // Dynamically derive from VITE_API_URL or default to localhost
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    try {
      const url = new URL(apiBase);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      // Strip '/api' from pathname suffix and map to websocket endpoint
      const wsHost = url.host;
      return `${protocol}//${wsHost}/ws/detect`;
    } catch (err) {
      // Fallback
      return "ws://localhost:8000/ws/detect";
    }
  };

  const connect = useCallback(() => {
    if (socketRef.current || isConnectingRef.current) return;

    isConnectingRef.current = true;
    const wsUrl = getWsUrl();
    const token = useAuthStore.getState().token;
    const fullUrl = token ? `${wsUrl}?token=${token}` : wsUrl;

    console.log("[WS] Connecting to:", wsUrl);

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
