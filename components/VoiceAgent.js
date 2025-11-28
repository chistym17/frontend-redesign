
/* -------------------------------------------------- *
 *  Sunrise Café – voice-only client (+ dynamic tools)
 *  Dynamic panels for any assistant/tools (audio untouched)
 * -------------------------------------------------- */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, Pause, CheckCircle2, Gift, AlertCircle, X, Search, Play } from "lucide-react";
import { useRouter } from "next/router";
import LeftSidebar from "./LeftSidebar";
import { useSidebar } from "../lib/sidebarContext";
import Image from "next/image";

/* --------------------------  CONFIG  -------------------------- */
const WS_AUDIO = process.env.NEXT_PUBLIC_WS_AUDIO || "wss://esapdev.xyz:7000/agentbuilder/ws/audio";
const OUTPUT_SAMPLE_RATE = 24_000;          // backend streams 24-kHz PCM
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

/* -----------------------  MAIN COMPONENT  --------------------- */
export default function Home() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  /* ---------------  STATE  ---------------- */
  const [status, setStatus] = useState("Disconnected");
  const [isRec, setIsRec] = useState(false);
  const [menu, setMenu] = useState([]);
  const [offers, setOffers] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [thankYou, setThankYou] = useState(null);
  const [complaintOk, setComplaintOk] = useState(false);

  // Phase-2: assistant state (picker)
  const [assistants, setAssistants] = useState([]);
  const [assistantId, setAssistantId] = useState(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [assistantSearch, setAssistantSearch] = useState("");

  // ---------- session continuity ----------
  const [sessionId, setSessionId] = useState(null);

  // ---------- Dynamic panels state ----------
  // panels: { [id]: { id, title, data, ts } }
  const [panels, setPanels] = useState({});
  const [activePanelId, setActivePanelId] = useState(null);
  const [toasts, setToasts] = useState([]); // [{id, text, isError}]

  // Flow HUD state
  const [flowEnabled, setFlowEnabled] = useState(true);
  const [flowEvents, setFlowEvents] = useState([]);
  const [flowCurrent, setFlowCurrent] = useState(null);
  const [currentMode, setCurrentMode] = useState(null); // backend-advertised mode
  const FLOW_MAX = 50;

  // WebSocket connection state
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  /* ---------------  REFS  ----------------- */
  const wsAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hpRef = useRef(null);
  const playerNodeRef = useRef(null);
  const micCtxRef = useRef(null);
  const micStreamRef = useRef(null);

  /* ------------------------------------------------------------ *
   *  AUDIO-PLAYBACK helpers                                      *
   * ------------------------------------------------------------ */
  const getAudioCtx = async () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      const ctx = new AC({ latencyHint: "interactive", sampleRate: 48_000 });
      await ctx.audioWorklet.addModule("/player-processor.js");
      const player = new AudioWorkletNode(ctx, "player-processor");
      const tone = ctx.createBiquadFilter();
      tone.type = "lowshelf";
      tone.frequency.value = 400;
      tone.gain.value = 6;
      player.connect(tone).connect(ctx.destination);

      ctx.resume();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 20;
      hp.Q.value = 0.7;
      player.connect(tone).connect(hp).connect(ctx.destination);

      audioCtxRef.current = ctx;
      hpRef.current = hp;
      playerNodeRef.current = player;
    }
    return audioCtxRef.current;
  };

  const playPCM = async (arrBuf) => {
    if (!(arrBuf instanceof ArrayBuffer)) return;
    const int16 = new Int16Array(arrBuf);
    const float24 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float24[i] = int16[i] / 32768;

    const ctx = await getAudioCtx();

    /* up-sample 24 k → 48 k (copy-hold) */
    let payload = float24;
    if (OUTPUT_SAMPLE_RATE !== ctx.sampleRate) {
      const factor = ctx.sampleRate / OUTPUT_SAMPLE_RATE; // 2
      const up = new Float32Array(float24.length * factor);
      for (let i = 0; i < float24.length; i++) {
        up[i * factor] = up[i * factor + 1] = float24[i];
      }
      payload = up;
    }

    playerNodeRef.current?.port.postMessage(payload, [payload.buffer]);
  };

  /* ======================== TOOL RESULT HELPERS ======================== */
  const unwrapToolData = (toolData) => {
    // Handle bootstrap events: { tool, result: {...} }
    let payload = toolData?.result !== undefined ? toolData.result : toolData;

    // Recursively unwrap nested 'data' fields
    while (payload?.data !== undefined && typeof payload.data === 'object') {
      payload = payload.data;
    }

    return payload;
  };

  const isToolError = (payload) => {
    if (!payload || typeof payload !== "object") return false;
    return (
      (payload.ok === false && payload.error) ||
      payload.error !== undefined ||
      payload.status === "error"
    );
  };

  const getErrorMessage = (payload) => {
    if (!payload || typeof payload !== "object") return "Unknown error";
    return payload.error || payload.message || "Operation failed";
  };

  /* ======================== EXISTING HELPERS ======================== */
  const titleize = (s) =>
    (s || "Update")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const slug = (s) =>
    (s || "panel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const pushToast = (text, ms = 4500, isError = false) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, text, isError }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  };

  const upsertPanel = (id, title, data) => {
    setPanels((prev) => {
      const next = { ...prev, [id]: { id, title: title || "Update", data, ts: Date.now() } };
      if (!activePanelId) setActivePanelId(id);
      return next;
    });
  };

  // Heuristics to choose a renderer
  const guessKind = (payload) => {
    if (Array.isArray(payload)) return "table";
    if (Array.isArray(payload?.results) || Array.isArray(payload?.items)) return "table";

    if (payload && typeof payload === "object") {
      // Skip meta/request/ok/data/tool wrapper fields
      const keys = Object.keys(payload).filter(k => !["meta", "request", "ok", "data", "tool"].includes(k));

      if (payload.rates && typeof payload.rates === "object" && !Array.isArray(payload.rates)) return "kv-rates";
      if (payload.listing && typeof payload.listing === "object") return "card";
      if (payload.item && typeof payload.item === "object") return "card";

      // Only count actual data fields, not metadata
      const dataVals = keys.map(k => payload[k]).filter(v => v !== undefined);

      // If we have no meaningful keys left, it's probably just wrapper - show as JSON
      if (dataVals.length === 0) return "json";

      const scalarShare =
        dataVals.filter((v) => ["string", "number", "boolean"].includes(typeof v)).length /
        Math.max(1, dataVals.length);
      if (scalarShare > 0.7) return "kv";
    }
    return "json";
  };

  const pickArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const formatVal = (v) => {
    if (v == null) return "—";
    if (typeof v === "number") return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  /* ======================== MESSAGE HANDLER ======================== */
  const handleMsg = useCallback(
    async (payload) => {
      if (payload instanceof ArrayBuffer) {
        playPCM(payload);
        return;
      }
      if (payload instanceof Blob) {
        playPCM(await payload.arrayBuffer());
        return;
      }

      let data;
      try {
        data = JSON.parse(payload);
      } catch {
        console.warn("Non-JSON text:", payload);
        return;
      }

      console.log("WS received:", data);

      // ---------- Bootstrap events ----------
      if (data.bootstrap && Array.isArray(data.events)) {
        console.log("Processing bootstrap events:", data.events.length);
        data.events.forEach((evt) => {
          if (evt.tool && evt.result) {
            const name = String(evt.tool || "update");
            const payloadObj = unwrapToolData(evt);
            const id = slug(name);

            // Check for errors
            if (isToolError(payloadObj)) {
              console.warn(`Bootstrap tool error [${name}]:`, payloadObj);
              return;
            }

            upsertPanel(id, titleize(name), payloadObj);
          }
        });
        return;
      }

      // ---------- Flow telemetry ----------
      if (data.flow) {
        setFlowEvents((evs) => [...evs, { ...data, ts: Date.now() }].slice(-FLOW_MAX));
        if (data.flow === "node" || data.flow === "init") {
          setFlowCurrent({ id: data.node_id, title: data.title || data.node_id });
        }
        if (data.flow === "mode") {
          setCurrentMode(data.mode || null);
          if (data.fallback) pushToast("Flow disabled – fell back to direct.");
        }
        return;
      }

      // ---------- Phase-1 shapes (keep existing behavior) ----------
      if (data.menu) {
        setMenu(data.menu);
        return;
      } else if (data.offers) {
        setOffers(data.offers);
        return;
      } else if (data.status === "added") {
        setCart((prev) => {
          const line = prev.find((l) => l.item === data.item);
          if (line) line.qty += data.qty;
          else prev.push({ item: data.item, qty: data.qty });
          return [...prev];
        });
        setSubmitted(false);
        return;
      } else if (data.status === "submitted") {
        setTotal(data.total);
        setSubmitted(true);
        setThankYou({ id: data.order_id, total: data.total });
        return;
      } else if (data.status === "complaint_logged") {
        setComplaintOk(true);
        setTimeout(() => setComplaintOk(false), 4_000);
        return;
      }

      // ---------- Generic dynamic-tool envelope ----------
      if (data.tool) {
        const name = String(data.tool || "update");
        const payloadObj = unwrapToolData(data);
        const id = slug(name);

        // Check for errors
        if (isToolError(payloadObj)) {
          const errMsg = getErrorMessage(payloadObj);
          pushToast(`${name}: ${errMsg}`, 5000, true);
          console.warn(`Tool error [${name}]:`, payloadObj);
          return;
        }

        upsertPanel(id, titleize(name), payloadObj);

        // Success notifications
        if (payloadObj?.scheduled) pushToast("Scheduled successfully");
        if (payloadObj?.ok && payloadObj?.ticket_id) pushToast(`Created ticket ${payloadObj.ticket_id}`);
        if (payloadObj?.ok === true) pushToast(`${titleize(name)} completed`);
        return;
      }

      // ---------- Heuristic: render any other object/array updates ----------
      if (Array.isArray(data) || typeof data === "object") {
        if (isToolError(data)) {
          pushToast(getErrorMessage(data), 5000, true);
          return;
        }

        if (data.scheduled || data.status === "appointment_booked") {
          pushToast("Appointment booked");
        } else if (data.ok && data.ticket_id) {
          pushToast(`Created ticket ${data.ticket_id}`);
        }

        const base =
          (data.results && "results") ||
          (data.listing && "listing") ||
          (data.items && "items") ||
          (data.rates && "rates") ||
          "update";
        const id = slug(base);
        const title = titleize(base);
        upsertPanel(id, title, data);
        return;
      }
    },
    [activePanelId]
  );

  const handleAssistantChange = useCallback((id) => {
    setAssistantId(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("assistant_id", id);
      else localStorage.removeItem("assistant_id");
    }
  }, []);

  const filteredAssistants = useMemo(() => {
    const term = assistantSearch.trim().toLowerCase();
    if (!term) return assistants;
    return assistants.filter((a) => {
      const name = a?.name?.toLowerCase?.() ?? "";
      const desc = a?.description?.toLowerCase?.() ?? "";
      return name.includes(term) || desc.includes(term);
    });
  }, [assistants, assistantSearch]);

  const panelEntries = useMemo(
    () => Object.entries(panels).sort((a, b) => a[1].ts - b[1].ts),
    [panels]
  );

  /* ------------------------------------------------------------ *
   *  Phase-2: load/create assistant list                         *
   * ------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/assistants`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const items = await res.json();
        if (!mounted) return;
        setAssistants(items);
        const saved = typeof window !== "undefined" ? localStorage.getItem("assistant_id") : null;
        const initial = saved && items.find((a) => a.id === saved) ? saved : items[0]?.id ?? null;
        handleAssistantChange(initial);
        setLoadingAssistant(false);
      } catch {
        try {
          const res2 = await fetch(`${API_BASE}/assistants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Sunrise Café", description: "Default assistant" }),
          });
          if (!res2.ok) throw new Error(await res2.text());
          const created = await res2.json();
          if (!mounted) return;
          setAssistants([created]);
          handleAssistantChange(created.id);
        } catch (e) {
          console.error("Assistant bootstrap failed:", e);
        } finally {
          setLoadingAssistant(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------ *
   *  Resolve or create a stable session_id per assistant         *
   * ------------------------------------------------------------ */
  async function getOrCreateSessionId(aid) {
    if (!aid) return null;

    try {
      const res = await fetch(`${API_BASE}/sessions/active?assistant_id=${aid}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const j = await res.json();
        if (j?.session_id) {
          localStorage.setItem(`sid:${aid}`, j.session_id);
          return j.session_id;
        }
      }
    } catch (e) {
      console.warn("DB session lookup failed, will fallback:", e);
    }

    let sid = localStorage.getItem(`sid:${aid}`);
    if (!sid) {
      sid = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(`sid:${aid}`, sid);
    }
    return sid;
  }

  useEffect(() => {
    (async () => {
      if (!assistantId) {
        setSessionId(null);
        return;
      }
      const sid = await getOrCreateSessionId(assistantId);
      setSessionId(sid);
    })();
  }, [assistantId]);

  /* ------------------------------------------------------------ *
   *  OPEN /ws/audio (assistant_id + mode + session_id)           *
   * ------------------------------------------------------------ */
  const connectWebSocket = () => {
    if (loadingAssistant || !assistantId || !sessionId) return;
    setIsConnecting(true);
    setStatus("Connecting...");

    const url = new URL(WS_AUDIO, window.location.href);
    url.searchParams.set("assistant_id", assistantId);
    url.searchParams.set("mode", flowEnabled ? "flow" : "direct");
    url.searchParams.set("session_id", sessionId);
    url.searchParams.set("ctx", "append");
    url.searchParams.set("memory_limit", "10");

    const ws = new WebSocket(url.toString(), [], { perMessageDeflate: false });
    ws.onopen = () => {
      ws.binaryType = "arraybuffer";
      setStatus("connected");
      setIsWsConnected(true);
      setIsConnecting(false);
    };
    ws.onclose = () => {
      setStatus("Disconnected");
      setIsWsConnected(false);
      setIsConnecting(false);
      setTimeout(connectWebSocket, 2_500);
    };
    ws.onerror = (e) => {
      console.error("WS error", e);
      ws.close();
      setIsWsConnected(false);
      setIsConnecting(false);
    };
    ws.onmessage = (e) => handleMsg(e.data);
    wsAudioRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsAudioRef.current) {
      wsAudioRef.current.close();
      wsAudioRef.current = null;
    }
    setIsWsConnected(false);
    setIsConnecting(false);
    setStatus("Disconnected");
  };

  useEffect(() => {
    if (wsAudioRef.current) {
      wsAudioRef.current.close();
      wsAudioRef.current = null;
    }
    setIsWsConnected(false);
    setIsConnecting(false);
    setStatus("Disconnected");

    setMenu([]);
    setOffers([]);
    setCart([]);
    setTotal(null);
    setSubmitted(false);
    setThankYou(null);
    setPanels({});
    setActivePanelId(null);
    setToasts([]);
    setComplaintOk(false);

    setFlowEvents([]);
    setFlowCurrent(null);
    setCurrentMode(null);
  }, [assistantId, flowEnabled]);

  /* ------------------------------------------------------------ *
   *  RECORDING toggle                                            *
   * ------------------------------------------------------------ */
  const toggleRec = async () => {
    if (isRec) {
      micCtxRef.current?.close();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      setIsRec(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AC = window.AudioContext ?? window.webkitAudioContext;
      const mic = new AC({ sampleRate: 16_000 });
      await mic.audioWorklet.addModule("/worklet-processor.js");
      const node = new AudioWorkletNode(mic, "mic-processor");
      node.port.onmessage = (e) => {
        if (wsAudioRef.current?.readyState === WebSocket.OPEN) wsAudioRef.current.send(e.data);
      };
      const src = mic.createMediaStreamSource(stream);
      const mute = mic.createGain();
      mute.gain.value = 0;
      src.connect(node);
      node.connect(mute);
      mute.connect(mic.destination);
      micCtxRef.current = mic;
      setIsRec(true);
      await getAudioCtx();
    } catch (err) {
      console.error(err);
    }
  };

  /* -------------------------  UI pieces  ---------------------- */
  const MenuPanel = ({ className = "" }) => (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-lg shadow-black/30 backdrop-blur-xl ${className}`}>
      <h3 className="mb-3 flex items-center text-xs font-semibold uppercase tracking-wide text-white/60">
        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
          <Gift size={16} />
        </span>
        Menu
      </h3>
      <div className="space-y-2 overflow-y-auto pr-1 max-h-[34vh]">
        {menu.map((m, idx) => (
          <div
            key={m.id ?? idx}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-xs transition-all duration-200 hover:border-emerald-400/40 hover:bg-white/10"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <span className="font-medium text-white/80">{m.name}</span>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
              ${m.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const OffersPanel = ({ className = "" }) => (
    <div className={`rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/25 to-emerald-600/40 p-4 text-white shadow-lg shadow-emerald-500/20 backdrop-blur-xl ${className}`}>
      <h3 className="mb-3 flex items-center text-xs font-semibold uppercase tracking-wide text-white/70">
        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10">
          <Gift size={16} />
        </span>
        Special Offers
      </h3>
      <div className="space-y-2 overflow-y-auto pr-1 max-h-[28vh]">
        {offers.map((o, i) => (
          <div
            key={`${o.title}-${i}`}
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/90 shadow-inner shadow-black/20"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {o.title}
          </div>
        ))}
      </div>
    </div>
  );

  const ThankYouCard = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center border border-gray-200/50 max-w-md mx-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500 delay-150">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl text-gray-900 font-bold mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-1">Order #{thankYou.id}</p>
        <p className="text-gray-600 mb-6">
          Total: <span className="font-bold text-emerald-600 text-xl">${thankYou.total}</span>
        </p>
        <button
          onClick={() => setThankYou(null)}
          className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const ComplaintToast = () => (
    <div className="fixed bottom-8 right-8 z-40 bg-red-500/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex items-center shadow-2xl border border-red-400/30 animate-in slide-in-from-bottom-5 duration-300">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
        <AlertCircle size={16} />
      </div>
      <span className="font-medium">Feedback recorded - thank you!</span>
    </div>
  );

  const AssistantList = ({ className = "" }) => {
    return (
      <div className={`flex h-full w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5  backdrop-blur-xl ${className}`}>
        <div className="flex items-center gap-3 pl-2">
          <h3 className="text-lg font-semibold text-white">Agent List</h3>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            value={assistantSearch}
            onChange={(e) => setAssistantSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full h-55  rounded-[8px]  border-2 border-[rgba(145,158,171,0.2)] bg-transparent py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            disabled={loadingAssistant}
          />
        </div>
        <div className="mt-4 flex flex-1 flex-col overflow-hidden min-h-0 space-y-2.5">
          {loadingAssistant ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 animate-pulse rounded-2xl bg-white/5"
                  style={{ animationDelay: `${idx * 80}ms` }}
                />
              ))}
            </div>
          ) : filteredAssistants.length ? (
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0 custom-scrollbar">
              {filteredAssistants.map((assistant) => {
                const isActive = assistantId === assistant.id;
                return (
                  <button
                    key={assistant.id}
                    type="button"
                    onClick={() => handleAssistantChange(assistant.id)}
                    className={`group flex w-full items-center justify-between rounded-2xl  px-2.5 py-2 text-left transition-all duration-200 ${isActive
                        ? " bg-white/5  hover:bg-white/10"
                        : " bg-transparent  hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">

                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27.846 14.4555L26.6665 13.8661C26.6665 7.97426 21.8905 3.19922 16 3.19922C10.1088 3.19922 5.33307 7.97426 5.33307 13.8661L4.15419 14.4555C3.62939 14.7179 3.19995 15.413 3.19995 15.9992V18.1327C3.19995 18.7189 3.62939 19.4139 4.15419 19.6763L5.33307 20.2658H6.93307V13.8661C6.93307 8.8661 11.0006 4.79922 16 4.79922C20.999 4.79922 25.0665 8.8661 25.0665 13.8661V22.3992C25.0665 25.0501 22.9177 27.1992 20.2665 27.1992H17.0665V25.5992H14.9331V28.7992H20.2665C23.8009 28.7992 26.6665 25.9336 26.6665 22.3992V20.2658L27.846 19.6763C28.3708 19.4139 28.7999 18.7189 28.7999 18.1327V15.9992C28.7999 15.413 28.3708 14.7179 27.846 14.4555Z" fill="#8E33FF" />
                        <path d="M20.2665 11.2004H16.8V8.93351C17.4291 8.71911 17.8665 8.26471 17.8665 7.73351C17.8665 6.99719 17.0313 6.40039 16 6.40039C14.9686 6.40039 14.1331 6.99719 14.1331 7.73351C14.1331 8.26471 14.5705 8.72039 15.2 8.93351V11.2004H11.7331C9.96668 11.2004 8.53308 12.6337 8.53308 14.4004V18.667C8.53308 21.6106 10.9232 24.0004 13.8668 24.0004H18.1334C21.0771 24.0004 23.4665 21.6106 23.4665 18.667V14.4004C23.4665 12.6337 22.0332 11.2004 20.2665 11.2004ZM12.2668 16.5338V15.4673C12.2668 14.8772 12.7449 14.4004 13.3331 14.4004C13.9219 14.4004 14.4 14.8772 14.4 15.4673V16.5338C14.4 17.1245 13.9219 17.6004 13.3331 17.6004C12.7449 17.6004 12.2668 17.1245 12.2668 16.5338ZM18.6665 20.8004L16.5334 21.3338H15.4668L13.3331 20.8004V19.7338H18.6665V20.8004ZM19.7334 16.5338C19.7334 17.1245 19.2553 17.6004 18.6665 17.6004C18.078 17.6004 17.6 17.1245 17.6 16.5338V15.4673C17.6 14.8772 18.078 14.4004 18.6665 14.4004C19.2553 14.4004 19.7334 14.8772 19.7334 15.4673V16.5338Z" fill="#8E33FF" />
                      </svg>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {assistant.name || "Untitled Assistant"}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/20 box-border transition-all`}
                      aria-hidden="true"
                    >
                      {isActive && (
                        <div className="absolute h-4 w-4  rounded-full border-4 border-[#13F584] box-border" />
                      )}
                    </div>

                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 px-4 py-5 text-center text-sm text-white/50">
              No assistants matched your search.
            </div>
          )}
        </div>
        <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
      </div>
    );
  };

  const AssistantPicker = () => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-gray-700">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-sm font-medium">Assistant</span>
      </div>
      <select
        className="bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:bg-white min-w-[160px] appearance-none cursor-pointer"
        value={assistantId ?? ""}
        onChange={(e) => handleAssistantChange(e.target.value || null)}
        disabled={loadingAssistant}
      >
        {assistants.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );

  /* ------------------- Flow HUD ------------------ */
  const FlowHUD = ({ className = "" }) => {
    const nodes = flowEvents
      .filter((e) => e.flow === "node" || e.flow === "init")
      .map((e) => e.title || e.node_id)
      .filter(Boolean)
      .slice(-10);

    const funcs = [...new Set(flowEvents.filter((e) => e.flow === "register_function").map((e) => e.name))];
    const hasActivity =
      nodes.length > 0 ||
      funcs.length > 0 ||
      Boolean(flowCurrent?.title || flowCurrent?.id) ||
      Boolean(currentMode);

    return (
      <div className={`flex flex-col h-full min-h-0 rounded-3xl border border-white/10 bg-white/5 text-white backdrop-blur-xl ${className}`}>
        <div className="flex items-center gap-3  border-white/5 px-4 py-3 flex-shrink-0">
          <div className={`h-2.5 w-2.5 rounded-full ${flowEnabled ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/70">Flow Monitor</h3>
        </div>

        {!flowEnabled ? (
          <div className="p-4 text-center text-[11px] text-white/50 flex-shrink-0">
            Enable Flow Mode to track node transitions in real time.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 p-4 text-[11px] text-white/70 min-h-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">Current Node</div>
                <div className="mt-1 font-semibold text-white truncate">
                  {flowCurrent?.title || flowCurrent?.id || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">Mode</div>
                <div className="mt-1 font-semibold text-white">
                  {currentMode || (flowEnabled ? "flow" : "direct")}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Recent Path</div>
              {!nodes.length ? (
                <div className="rounded-[8px]  bg-white/5 py-1.5 px-2 text-center text-[8px] text-white/40">
                  No path data yet
                </div>
              ) : (
                <div className="pr-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {nodes.map((n, i) => (
                      <React.Fragment key={i}>
                        <span
                          className={`rounded-[4px] px-2.5 py-1 text-[10px] font-medium transition-all duration-200  ${i === nodes.length - 1
                              ? " bg-[rgba(0,184,217,0.16)] text-[#61F3F3]"
                              : "bg-[rgba(34,197,94,0.16)] text-[#77ED8B]"
                            }`}
                        >
                          {n}
                        </span>
                        {i < nodes.length - 1 && <span className="text-white/60 text-[12px]">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Functions</div>
              {!funcs.length ? (
                <div className="rounded-[8px]  bg-white/5 py-1.5 px-2 text-center text-[8px] text-white/40">
                  No functions registered
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {funcs.map((f, idx) => (
                    <span
                      key={f}
                      className="rounded-[4px] bg-[rgba(34,197,94,0.16)] text-[#77ED8B]  px-2.5 py-1 text-[10px] "
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!hasActivity && (
              <div className="rounded-[8px]  bg-white/5 py-1.5 px-2 text-center text-[8px] text-white/50">
                Flow activity will appear here once the conversation starts.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ================= ENHANCED PANEL BODY ================= */
  const GenericPanelBody = ({ panel }) => {
    const data = panel?.data;

    // Handle error state
    if (isToolError(data)) {
      return (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <p className="text-red-300 font-semibold mb-2">Error</p>
          <p className="text-red-400/80 text-sm">{getErrorMessage(data)}</p>
        </div>
      );
    }

    const kind = guessKind(data);

    if (kind === "table") {
      const rows = pickArray(data);
      const cols = rows.length ? Object.keys(rows[0]).filter(k => !["meta", "request", "ok", "data", "tool"].includes(k)).slice(0, 6) : [];
      return (
        <div>
          {!rows.length ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Gift size={24} className="text-white/40" />
              </div>
              <p className="text-white/50">No results found</p>
            </div>
          ) : (
            <div
              className="overflow-auto rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr>
                    {cols.map((c) => (
                      <th
                        key={c}
                        className="py-3 px-4 font-semibold capitalize text-white/70 border-b"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {c.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className="transition-colors duration-150 animate-in fade-in hover:bg-white/5"
                      style={{
                        animationDelay: `${i * 30}ms`,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {cols.map((c) => (
                        <td key={c} className="py-3 px-4 text-white/60">
                          {formatVal(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (kind === "kv-rates") {
      const kv = Object.entries(data.rates || {}).filter(([k]) => !["meta", "request", "ok", "data", "tool"].includes(k));
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {kv.map(([k, v], idx) => (
            <div
              key={k}
              className="flex justify-between items-center p-4 rounded-xl transition-all duration-200 animate-in slide-in-from-left-3 hover:bg-white/5"
              style={{
                animationDelay: `${idx * 50}ms`,
                background: 'rgba(19, 245, 132, 0.08)',
                border: '1px solid rgba(19, 245, 132, 0.2)'
              }}
            >
              <span className="text-white/70 font-medium">{k.replaceAll("_", " ")}</span>
              <span className="text-emerald-300 font-bold text-lg">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (kind === "card") {
      const obj = data.listing || data.item || data;
      const entries = Object.entries(obj).filter(([k]) => !k.startsWith("_") && !["meta", "request", "ok", "data", "tool"].includes(k));
      return (
        <div className="space-y-3">
          {entries.map(([k, v], idx) => (
            <div
              key={k}
              className="flex justify-between items-center p-4 rounded-xl transition-all duration-200 animate-in slide-in-from-left-3 hover:bg-white/5"
              style={{
                animationDelay: `${idx * 50}ms`,
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <span className="text-white/70 font-medium capitalize">{k.replaceAll("_", " ")}</span>
              <span className="text-white font-semibold">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (kind === "kv") {
      const entries = Object.entries(data).filter(([k]) => !k.startsWith("_") && !["meta", "request", "ok", "data", "tool"].includes(k));
      return (
        <div className="space-y-3">
          {entries.map(([k, v], idx) => (
            <div
              key={k}
              className="flex justify-between items-center p-4 rounded-xl transition-all duration-200 animate-in slide-in-from-left-3 hover:bg-white/5"
              style={{
                animationDelay: `${idx * 50}ms`,
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}
            >
              <span className="text-white/70 font-medium capitalize">{k.replaceAll("_", " ")}</span>
              <span className="text-white font-semibold">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    // fallback JSON - only show if no structured format matched
    const meaningfulKeys = Object.keys(data).filter(k => !["meta", "request", "ok", "data", "tool"].includes(k));
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {meaningfulKeys.length > 0 && (
          <div className="text-xs text-white/40 mb-3 font-mono">
            Raw Response (no structured format matched):
          </div>
        )}
        <pre
          className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-96 p-3 rounded"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  /* ================= DYNAMIC PANELS RENDERER ================= */
  const PanelTabs = ({ entries, className = "" }) => {
    if (!entries.length) return null;
    const activeIdx = Math.max(0, entries.findIndex(([id]) => id === activePanelId));
    const [aId, aPanel] = entries[activeIdx] || entries[0];

    return (
      <div
        className={`flex h-full flex-col overflow-hidden rounded-3xl text-white shadow-xl ${className}`}
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 px-3 py-2">
          {entries.map(([id, p], idx) => (
            <button
              key={id}
              onClick={() => setActivePanelId(id)}
              className={`whitespace-nowrap rounded-2xl px-4 py-2 text-[10px] font-medium uppercase tracking-wide transition-all duration-200 ${id === aId
                  ? "bg-emerald-500/30 text-emerald-100 shadow-inner shadow-emerald-500/30"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              style={{ animationDelay: `${idx * 50}ms` }}
              title={p.title}
            >
              {p.title}
            </button>
          ))}
          {entries.length > 1 && (
            <button
              onClick={() => {
                setPanels({});
                setActivePanelId(null);
              }}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all hover:border-white/30 hover:text-white"
              title="Close all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <GenericPanelBody panel={aPanel} />
          </div>
        </div>
      </div>
    );
  };
  /* ---------------------------  MAIN RENDER  ----------------------- */
  return (
    <div className="min-h-screen h-screen bg-[#141A21] text-white">
      {/* Left Sidebar */}
      <LeftSidebar />

      <div
        className={`relative flex h-full flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-[140px]"
          }`}
      >
        <div className="flex h-full flex-col">
          <main className="flex h-full flex-1 flex-col overflow-hidden items-center justify-center p-6 lg:px-[120px] lg:py-[60px]">
            {/* Parent Container with margins (matching ChatInterface design) */}
            <div className="flex flex-1 min-h-0 w-full max-w-[1800px] max-h-[900px] flex-col gap-5 overflow-hidden lg:flex-row lg:items-stretch">
              <div className="flex min-h-0 w-full flex-shrink-0 flex-col space-y-4 lg:h-full lg:max-w-[280px] lg:max-h-full">
                <div className="min-h-0 lg:flex-[0.50] lg:overflow-hidden">
                  <AssistantList className="h-full min-h-0" />
                </div>
                <div className="min-h-0 lg:flex-[0.50] hidden lg:block lg:overflow-hidden">
                  <FlowHUD className="h-full min-h-0" />
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col lg:h-full lg:max-h-full">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5  backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3  px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">

                        {/* Expanding Glow */}
                        <div className="
                          absolute 
                          w-[70px] 
                          h-[70px] 
                          rounded-full 
                          bg-[radial-gradient(circle,rgba(19,245,132,0.6),rgba(19,245,132,0)_70%)]
                          blur-[20px]
                        "></div>

                        {/* Outer Ring */}
                        <div className="absolute w-[60px] h-[60px] rounded-full border border-[#13F584]/40"></div>

                        {/* Main Circle */}
                        <div className="
                          relative 
                          w-[45px] 
                          h-[45px] 
                          rounded-full 
                          border 
                          border-[rgba(19,245,132,0.3)] 
                          flex 
                          items-center 
                          justify-center
                        ">

                          {/* The image */}
                          <Image
                            src="/images/voiceAi.svg"
                            alt="AI Assistant"
                            width={45}
                            height={45}
                            className="relative z-10"
                          />
                        </div>

                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-white">AI Assistance</h2>

                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={flowEnabled}
                            onChange={(e) => setFlowEnabled(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div
                            className={`flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${flowEnabled ? "bg-emerald-500/30 border-emerald-400/50" : "bg-white/5 border-white/15"
                              }`}
                          >
                            <div
                              className={`ml-1 h-3 w-3 rounded-full bg-white transition-transform duration-200 ${flowEnabled ? "translate-x-5" : ""
                                }`}
                            />
                          </div>
                        </div>
                        <span className="font-medium text-white">Flow Mode</span>
                      </label>
                      <button
                        onClick={isWsConnected ? disconnectWebSocket : connectWebSocket}
                        className={`h-[30px] px-2 flex items-center justify-center gap-2 rounded-lg font-medium text-[13px] transition-all duration-200 ${isWsConnected
                            ? "text-[#9EFBCD] bg-[rgba(19,245,132,0.08)]  hover:bg-[rgba(19,245,132,0.09)]"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                          }`}
                        style={{ fontFamily: 'Public Sans, sans-serif', lineHeight: '1.6923076923076923em' }}
                        disabled={loadingAssistant || !assistantId || !sessionId || isConnecting}
                        title={!sessionId ? "Resolving session..." : ""}
                      >
                        {isConnecting && (
                          <div className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                        )}
                        <span>{isConnecting ? "Connecting…" : isWsConnected ? "Disconnect" : "Connect"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-[1.2] overflow-hidden px-6 py-6 relative">
                    {panelEntries.length ? (
                      <div className="pt-4 h-full relative">
                        <PanelTabs entries={panelEntries} className="h-full" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center px-6">
                        <p className="text-xs text-white/60 text-center">
                          Pick an assistant on the left, connect, then push-to-talk to begin.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 px-3 py-0.5   ">
                    <div className="grid w-full gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">

                      <div
                        className="
                        box-border
                        flex flex-col items-start
                        p-4 gap-[5px]
                        w-full max-w-sm
                        h-auto min-h-[148px]
                        bg-white/5
                        rounded-[16px]
                      "
                      >

                        <div className="flex flex-row items-start gap-[9px] w-full h-auto">
                          {/* Icon */}
                          <div className="flex items-center justify-center w-[48px] h-[48px] ">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="48" height="48" rx="24" fill="white" fill-opacity="0.04" />
                              <rect x="0.6" y="0.6" width="46.8" height="46.8" rx="23.4" stroke="#919EAB" stroke-opacity="0.32" stroke-width="1.2" />
                              <path d="M21.9216 34.7988C22.1323 35.1636 22.4353 35.4666 22.8001 35.6772C23.1649 35.8878 23.5788 35.9987 24 35.9987C24.4213 35.9987 24.8351 35.8878 25.2 35.6772C25.5648 35.4666 25.8678 35.1636 26.0784 34.7988" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M13.5141 27.9912C13.3573 28.163 13.2539 28.3767 13.2163 28.6062C13.1788 28.8358 13.2087 29.0713 13.3025 29.2841C13.3964 29.4969 13.55 29.6779 13.7448 29.805C13.9396 29.9321 14.1671 29.9998 14.3997 30H33.5997C33.8322 30.0001 34.0598 29.9326 34.2547 29.8057C34.4496 29.6789 34.6035 29.4981 34.6976 29.2854C34.7916 29.0727 34.8219 28.8373 34.7846 28.6077C34.7474 28.3782 34.6442 28.1644 34.4877 27.9924C32.8917 26.3472 31.1997 24.5988 31.1997 19.2C31.1997 17.2904 30.4411 15.4591 29.0909 14.1088C27.7406 12.7586 25.9092 12 23.9997 12C22.0901 12 20.2588 12.7586 18.9085 14.1088C17.5583 15.4591 16.7997 17.2904 16.7997 19.2C16.7997 24.5988 15.1065 26.3472 13.5141 27.9912Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            {/* Notification label */}
                            <div className="absolute left-[24px] top-[7px] w-[16px] h-[16px] bg-[#FF5630] border border-white rounded-full flex justify-center items-center hidden"></div>
                          </div>

                          {/* Text stack */}
                          <div className="flex flex-col items-start gap-1 w-full h-auto">
                            <div className="font-public-sans font-semibold text-[16px] leading-[24px] text-white">
                              Overview
                            </div>
                            <div className="font-public-sans font-normal text-[14px] leading-[22px] text-white">
                              Blumen Café is a contemporary coffeehouse located in the heart of Riyadh...
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="
                        box-border
                        flex flex-col items-start
                        p-4 gap-[9px]
                        w-full max-w-sm
                        h-auto min-h-[148px]
                        bg-white/5
                        rounded-[16px]
                      "
                      >
                        <div className="flex flex-row items-start gap-[9px] w-full h-auto">
                          {/* Icon */}
                          <div className="flex items-center justify-center w-[48px] h-[48px] ">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="48" height="48" rx="24" fill="white" fill-opacity="0.04" />
                              <rect x="0.6" y="0.6" width="46.8" height="46.8" rx="23.4" stroke="#919EAB" stroke-opacity="0.32" stroke-width="1.2" />
                              <path d="M21.9216 34.7988C22.1323 35.1636 22.4353 35.4666 22.8001 35.6772C23.1649 35.8878 23.5788 35.9987 24 35.9987C24.4213 35.9987 24.8351 35.8878 25.2 35.6772C25.5648 35.4666 25.8678 35.1636 26.0784 34.7988" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M13.5141 27.9912C13.3573 28.163 13.2539 28.3767 13.2163 28.6062C13.1788 28.8358 13.2087 29.0713 13.3025 29.2841C13.3964 29.4969 13.55 29.6779 13.7448 29.805C13.9396 29.9321 14.1671 29.9998 14.3997 30H33.5997C33.8322 30.0001 34.0598 29.9326 34.2547 29.8057C34.4496 29.6789 34.6035 29.4981 34.6976 29.2854C34.7916 29.0727 34.8219 28.8373 34.7846 28.6077C34.7474 28.3782 34.6442 28.1644 34.4877 27.9924C32.8917 26.3472 31.1997 24.5988 31.1997 19.2C31.1997 17.2904 30.4411 15.4591 29.0909 14.1088C27.7406 12.7586 25.9092 12 23.9997 12C22.0901 12 20.2588 12.7586 18.9085 14.1088C17.5583 15.4591 16.7997 17.2904 16.7997 19.2C16.7997 24.5988 15.1065 26.3472 13.5141 27.9912Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            {/* Notification label */}
                            <div className="absolute left-[24px] top-[7px] w-[16px] h-[16px] bg-[#FF5630] border border-white rounded-full flex justify-center items-center hidden"></div>
                          </div>

                          {/* Text stack */}
                          <div className="flex flex-col items-start gap-1 w-full h-auto">
                            <div className="font-public-sans font-semibold text-[16px] leading-[24px] text-white">
                              Overview
                            </div>
                            <div className="font-public-sans font-normal text-[14px] leading-[22px] text-white">
                              Blumen Café is a contemporary coffeehouse located in the heart of Riyadh...
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="
                        box-border
                        flex flex-col items-start
                        p-4 gap-[9px]
                        w-full max-w-sm
                        h-auto min-h-[148px]
                        bg-white/5
                        rounded-[16px]
                      "
                      >
                        <div className="flex flex-row items-start gap-[9px] w-full h-auto">
                          {/* Icon */}
                          <div className="flex items-center justify-center w-[48px] h-[48px] ">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="48" height="48" rx="24" fill="white" fill-opacity="0.04" />
                              <rect x="0.6" y="0.6" width="46.8" height="46.8" rx="23.4" stroke="#919EAB" stroke-opacity="0.32" stroke-width="1.2" />
                              <path d="M21.9216 34.7988C22.1323 35.1636 22.4353 35.4666 22.8001 35.6772C23.1649 35.8878 23.5788 35.9987 24 35.9987C24.4213 35.9987 24.8351 35.8878 25.2 35.6772C25.5648 35.4666 25.8678 35.1636 26.0784 34.7988" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M13.5141 27.9912C13.3573 28.163 13.2539 28.3767 13.2163 28.6062C13.1788 28.8358 13.2087 29.0713 13.3025 29.2841C13.3964 29.4969 13.55 29.6779 13.7448 29.805C13.9396 29.9321 14.1671 29.9998 14.3997 30H33.5997C33.8322 30.0001 34.0598 29.9326 34.2547 29.8057C34.4496 29.6789 34.6035 29.4981 34.6976 29.2854C34.7916 29.0727 34.8219 28.8373 34.7846 28.6077C34.7474 28.3782 34.6442 28.1644 34.4877 27.9924C32.8917 26.3472 31.1997 24.5988 31.1997 19.2C31.1997 17.2904 30.4411 15.4591 29.0909 14.1088C27.7406 12.7586 25.9092 12 23.9997 12C22.0901 12 20.2588 12.7586 18.9085 14.1088C17.5583 15.4591 16.7997 17.2904 16.7997 19.2C16.7997 24.5988 15.1065 26.3472 13.5141 27.9912Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            {/* Notification label */}
                            <div className="absolute left-[24px] top-[7px] w-[16px] h-[16px] bg-[#FF5630] border border-white rounded-full flex justify-center items-center hidden"></div>
                          </div>

                          {/* Text stack */}
                          <div className="flex flex-col items-start gap-1 w-full h-auto">
                            <div className="font-public-sans font-semibold text-[16px] leading-[24px] text-white">
                              Overview
                            </div>
                            <div className="font-public-sans font-normal text-[14px] leading-[22px] text-white">
                              Blumen Café is a contemporary coffeehouse located in the heart of Riyadh...
                            </div>
                          </div>
                        </div>
                      </div>


                    </div></div>

                  <div className="flex-shrink-0  px-3 py-3">


                    <div
                      className="
                      box-border flex flex-col justify-center items-center
                      p-4 w-full h-auto min-h-[100px]
                      bg-white/5 rounded-[16px]
                    "
                    >

                      <div className="flex items-center gap-10 md:gap-[88px]">

                        {/* Play Button - Starts recording if not already recording */}
                        <div className="flex items-center p-2 gap-4 w-12 h-12 bg-white/4 rounded-[44px]">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isRec) toggleRec(); // start recording
                              else toggleRec();        // stop recording
                            }}
                            className="
                              flex items-center justify-center
                              px-2 gap-[5.33px] w-8 h-8
                              bg-[rgba(19,245,132,0.12)]
                              border border-[rgba(19,245,132,0.32)]
                              rounded-[66px]
                              hover:bg-emerald-400/20
                              transition-all duration-200
                            "
                          >
                            {/* MIDDLE CIRCLE (white 4% opacity, radius = 19.8276) */}
                            <span
                              className="
                                                          absolute w-[50px] h-[50px]
                                                          rounded-full bg-white/5 
                                                          -z-10
                                                        "
                            />
                            {isRec ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>

                        </div>
                        {/* Voice Button - Toggles recording (existing functionality) */}
                        <div className="flex flex-col items-center gap-[13px]">
                          <div className="flex items-center p-[5.17241px] gap-[10.34px] w-[50px] h-[50px] bg-white/4 rounded-[28.4483px]">
                            <div className="flex items-center p-[5.17241px] gap-[10.34px] w-[39.66px] h-[39.66px] bg-white/4 rounded-[28.4483px]">
                              <button
                                type="button"
                                onClick={toggleRec}
                                className="
                              relative flex items-center justify-center
                              w-[29.31px] h-[29.31px]
                              rounded-full transition-all duration-300
                            "
                              >
                                {/* OUTER CIRCLE (white 4% opacity) */}
                                <span
                                  className="
                                absolute inset-0 rounded-full
                                bg-white/5   /* == fill-opacity 0.04 */
                                -z-20
                              "
                                />

                                {/* MIDDLE CIRCLE (white 4% opacity, radius = 19.8276) */}
                                <span
                                  className="
                                absolute w-[50px] h-[50px]
                                rounded-full bg-white/5 
                                -z-10
                              "
                                />
                                {/* MIDDLE CIRCLE (white 4% opacity, radius = 19.8276) */}
                                <span
                                  className="
                                absolute w-[40px] h-[40px]
                                rounded-full bg-white/5 
                                -z-10
                              "
                                />

                                {/* INNER GREEN CIRCLE (#13F584, opacity 0.12) */}
                                <span
                                  className={`
                                absolute w-[29.31px] h-[29.31px]
                                rounded-full transition-all
                                ${isRec ? "bg-red-500/25" : "bg-[rgba(19,245,132,0.12)]"}
                              `}
                                />

                                {/* GREEN STROKED BORDER (stroke-opacity 0.32) */}
                                <span
                                  className={`
                                absolute w-[28.7px] h-[28.7px]
                                rounded-full border
                                transition-all
                                ${isRec
                                      ? "border-red-400/80"
                                      : "border-[rgba(19,245,132,0.32)]"
                                    }
                              `}
                                  style={{ borderWidth: "0.61px" }}
                                />

                                {/* MIC ICON */}
                                <Mic
                                  size={14.66}
                                  className={isRec ? "text-red-400 animate-pulse" : "text-[#13F584]"}
                                />
                              </button>


                            </div>
                          </div>
                          <div className="flex items-center  gap-2 text-xs text-white/80">

                            <span>{isRec ? "Listening…" : "Push to talk"}</span>
                          </div>
                        </div>
                        {/* Stop Button - Stops recording if currently recording */}
                        <div className="flex items-center p-2 gap-4 w-12 h-12 bg-white/4 rounded-[44px]">
                          <button
                            type="button"
                            onClick={() => { if (isRec) toggleRec(); }}
                            disabled={!isRec}
                            className={`
                   
                    ${isRec ? "" : "opacity-40 cursor-not-allowed"}
                  `}
                          >
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="48" height="48" rx="24" fill="white" fill-opacity="0.04" />
                              <rect x="8" y="8" width="32" height="32" rx="16" fill="#FF7676" fill-opacity="0.12" />
                              <rect x="8.33333" y="8.33333" width="31.3333" height="31.3333" rx="15.6667" stroke="#FF7676" stroke-opacity="0.32" stroke-width="0.666667" />
                              <path d="M20.998 18.8127L29.4776 27.2923C29.7843 27.599 29.9698 28.0017 29.9935 28.4117C30.0171 28.8218 29.8768 29.2057 29.6036 29.479L29.2601 29.8224C28.9868 30.0957 28.6029 30.236 28.1929 30.2123C27.7828 30.1887 27.3801 30.0032 27.0734 29.6965L18.5938 21.2169C18.2871 20.9102 18.1016 20.5075 18.078 20.0974C18.0543 19.6874 18.1946 19.3035 18.4679 19.0302L18.8113 18.6867C19.0846 18.4135 19.4685 18.2732 19.8786 18.2968C20.2886 18.3205 20.6913 18.506 20.998 18.8127Z" fill="#FF7676" />
                              <path d="M29.37 18.4757L29.7134 18.8191C29.9867 19.0924 30.1269 19.4763 30.1033 19.8864C30.0797 20.2964 29.8941 20.6991 29.5874 21.0058L21.1078 29.4854C20.8011 29.7921 20.3985 29.9776 19.9884 30.0013C19.5783 30.0249 19.1944 29.8846 18.9212 29.6114L18.5777 29.2679C18.3044 28.9947 18.1642 28.6108 18.1878 28.2007C18.2114 27.7906 18.397 27.3879 18.7037 27.0813L27.1833 18.6016C27.49 18.295 27.8926 18.1094 28.3027 18.0858C28.7128 18.0622 29.0967 18.2024 29.37 18.4757Z" fill="#FF7676" />
                            </svg>

                          </button>

                        </div>
                      </div>

                    </div>
                  </div>


                </div>

                <div className="flex w-full flex-shrink-0 flex-col gap-4 lg:w-72">
                  {menu.length > 0 && <MenuPanel />}
                  {offers.length > 0 && <OffersPanel />}
                  <FlowHUD className="lg:hidden" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {thankYou && <ThankYouCard />}
      {complaintOk && <ComplaintToast />}

      <div className="fixed bottom-8 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-4">
        {toasts.map((t, idx) => {
          const isError = t.isError;
          return (
            <div
              key={t.id}
              className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-2xl ${isError
                  ? "border-red-400/40 bg-red-500/80 text-white"
                  : "border-emerald-400/40 bg-emerald-500/80 text-white"
                }`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                {isError ? <AlertCircle size={18} /> : <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};