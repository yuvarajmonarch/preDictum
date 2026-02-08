// apps/web/src/twin/useTwinSocket.js
import { useEffect, useRef, useState } from "react";
import { getTwinState } from "../api/twin.api.js";

const WS_URL = "ws://localhost:8080/ws/twin";

/**
 * useTwinSocket
 * - Connects to WS, receives { type: "TWIN_STATE", data: snapshot }
 * - Auto-reconnect with backoff
 * - Falls back to polling via REST when WS not available
 */
export default function useTwinSocket({ enabled = true } = {}) {
  const [twin, setTwin] = useState(null);
  const [mode, setMode] = useState("connecting"); // live | polling | connecting
  const [error, setError] = useState("");

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const retryRef = useRef({ attempt: 0, timer: null });

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    function stopPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }

    function startPolling() {
      stopPolling();
      setMode("polling");

      const tick = async () => {
        try {
          const snapshot = await getTwinState();
          if (!alive) return;
          setTwin(snapshot);
        } catch (e) {
          if (!alive) return;
          setError(e?.message || "Polling error");
        }
      };

      tick();
      pollRef.current = setInterval(tick, 2000);
    }

    function cleanupWs() {
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    }

    function scheduleReconnect() {
      const attempt = (retryRef.current.attempt || 0) + 1;
      retryRef.current.attempt = attempt;

      // backoff: 0.6s, 1.2s, 2.4s, 4s max
      const delay = Math.min(4000, 600 * Math.pow(2, attempt - 1));

      if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
      retryRef.current.timer = setTimeout(() => {
        if (!alive) return;
        connectWs();
      }, delay);
    }

    async function primeSnapshot() {
      try {
        const snapshot = await getTwinState();
        if (!alive) return;
        setTwin(snapshot);
      } catch {
        // ignore
      }
    }

    function connectWs() {
      setError("");
      setMode("connecting");
      cleanupWs();
      stopPolling();

      let ws;
      try {
        ws = new WebSocket(WS_URL);
      } catch (e) {
        setError("WebSocket not supported. Using polling.");
        startPolling();
        return;
      }

      wsRef.current = ws;

      ws.onopen = async () => {
        if (!alive) return;
        retryRef.current.attempt = 0;
        setMode("live");
        await primeSnapshot();
      };

      ws.onmessage = (evt) => {
        if (!alive) return;
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.type === "TWIN_STATE") setTwin(msg.data);
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        if (!alive) return;
        setError("WebSocket error. Switching to polling.");
        startPolling();
        scheduleReconnect();
      };

      ws.onclose = () => {
        if (!alive) return;
        setError("WebSocket closed. Switching to polling.");
        startPolling();
        scheduleReconnect();
      };
    }

    connectWs();

    return () => {
      alive = false;
      stopPolling();
      cleanupWs();
      if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
    };
  }, [enabled]);

  return { twin, setTwin, mode, error };
}
