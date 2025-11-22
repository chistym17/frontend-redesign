
/* -------------------------------------------------- *
 *  Sunrise Café – voice-only client (+ dynamic tools)
 *  Dynamic panels for any assistant/tools (audio untouched)
 * -------------------------------------------------- */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, CheckCircle2, Gift, AlertCircle, X, Search } from "lucide-react";
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
    <div className={`flex h-full w-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl ${className}`}>
      <div className="flex items-center gap-3 pl-2">
        <h3 className="text-lg font-semibold text-white">Agent List</h3>
      </div>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          value={assistantSearch}
          onChange={(e) => setAssistantSearch(e.target.value)}
          placeholder="Search agents"
          className="w-full rounded-2xl border border-white/5 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
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
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
            {filteredAssistants.map((assistant) => {
              const isActive = assistantId === assistant.id;
              return (
                <button
                  key={assistant.id}
                  type="button"
                  onClick={() => handleAssistantChange(assistant.id)}
                  className={`group flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left transition-all duration-200 ${
                    isActive
                      ? "border-emerald-400/60 bg-emerald-500/20 shadow-md shadow-emerald-500/20"
                      : "border-white/5 bg-white/5 hover:border-emerald-400/30 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xs font-semibold ${
                        isActive ? "text-emerald-200" : "text-white/70"
                      }`}
                    >
                      {(assistant.name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {assistant.name || "Untitled Assistant"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[8px] font-semibold transition-colors ${
                      isActive
                        ? "border-emerald-300 bg-emerald-500/80 text-white"
                        : "border-white/20 text-white/40 group-hover:border-emerald-200/40 group-hover:text-emerald-200"
                    }`}
                    aria-hidden="true"
                  >
                    {isActive ? "✓" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-sm text-white/50">
            No assistants matched your search.
          </div>
        )}
      </div>
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
    <div className={`flex flex-col h-full min-h-0 rounded-3xl border border-white/10 bg-white/5 text-white shadow-xl shadow-black/30 backdrop-blur-xl ${className}`}>
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 flex-shrink-0">
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
                {flowCurrent?.title || flowCurrent?.id || "—"}
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
              <div className="rounded-xl border border-white/10 bg-white/5 py-1.5 px-2 text-center text-[9px] text-white/40">
                No path data yet
              </div>
            ) : (
              <div className="pr-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {nodes.map((n, i) => (
                    <React.Fragment key={i}>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-200 border ${
                          i === nodes.length - 1
                            ? "border-blue-300/60 bg-blue-500/20 text-blue-100"
                            : "border-emerald-300/60 bg-emerald-500/15 text-emerald-100"
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
            <div className="rounded-xl border border-white/10 bg-white/5 py-1.5 px-2 text-center text-[9px] text-white/40">
              No functions registered
            </div>
          ) : (
              <div className="flex flex-wrap gap-2">
                {funcs.map((f, idx) => (
                  <span
                    key={f}
                    className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-100"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!hasActivity && (
            <div className="rounded-xl border border-white/10 bg-white/5 py-1.5 px-2 text-center text-[9px] text-white/50">
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
            className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-200 ${
              id === aId 
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
            <X size={16} />
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
        className="relative flex h-full flex-col overflow-hidden"
        style={{ marginLeft: isCollapsed ? "56px" : "176px" }}
      >
        <div className="flex h-full flex-col">
          <main className="flex h-full flex-1 flex-col overflow-hidden items-center justify-center p-4 lg:px-16 lg:py-10">
            {/* Parent Container with margins (matching ChatInterface design) */}
            <div className="flex flex-1 min-h-0 w-full max-w-[1800px] flex-col gap-5 overflow-hidden lg:flex-row lg:items-stretch">
              <div className="flex min-h-0 w-full flex-shrink-0 flex-col space-y-4 lg:h-full lg:max-w-[360px] lg:max-h-full">
                <div className="min-h-0 lg:flex-[0.50] lg:overflow-hidden">
                  <AssistantList className="h-full min-h-0" />
                </div>
                <div className="min-h-0 lg:flex-[0.50] hidden lg:block lg:overflow-hidden">
                  <FlowHUD className="h-full min-h-0" />
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col lg:h-full lg:max-h-full">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-[45px] h-[45px] rounded-full bg-[#13F584] opacity-20 blur-[10px]"></div>
                        <div className="relative w-[45px] h-[45px] rounded-full bg-[rgba(19,245,132,0.1)] border border-[rgba(19,245,132,0.3)] flex items-center justify-center">
                          <Image src="/images/ai2.svg" alt="AI Assistant" width={45} height={45} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">AI Assistance</h2>
                        <p className="text-xs text-white/50">
                          Connect, monitor, and collaborate with your live voice agent.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-white/70">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={flowEnabled}
                            onChange={(e) => setFlowEnabled(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div
                            className={`flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                              flowEnabled ? "bg-emerald-500/80" : "bg-white/20"
                            }`}
                          >
                            <div
                              className={`ml-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                                flowEnabled ? "translate-x-5" : ""
                              }`}
                            />
                          </div>
                        </div>
                        <span className="font-semibold text-white">Flow Mode</span>
                      </label>
                      <button
                        onClick={isWsConnected ? disconnectWebSocket : connectWebSocket}
                        className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold transition-transform duration-200 ${
                          isWsConnected
                            ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500"
                            : "bg-white/10 text-white/80 hover:bg-white/20"
                        }`}
                        disabled={loadingAssistant || !assistantId || !sessionId || isConnecting}
                        title={!sessionId ? "Resolving session..." : ""}
                      >
                        {isConnecting && (
                          <div className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
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
                        <p className="text-sm text-white/60 text-center">
                          Pick an assistant on the left, connect, then push-to-talk to begin.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 border-t border-white/5 px-6 py-5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/60">
                        <span>{isWsConnected ? "Connected to voice channel" : "Connect to start streaming audio"}</span>
                        <span className="hidden sm:inline text-white/30">•</span>
                        <span>{isRec ? "Recording live" : "Push to talk"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleRec}
                        className={`relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
                          isRec
                            ? "border-red-400/80 bg-red-500/25 shadow-xl shadow-red-500/30"
                            : "border-emerald-400/60 bg-emerald-500/15 hover:border-emerald-300 hover:bg-emerald-400/20"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            isRec ? "bg-red-500/60" : "bg-emerald-500/25"
                          }`}
                        >
                          <Mic size={16} className={isRec ? "animate-pulse" : ""} />
                        </div>
                      </button>
                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <span>Push to talk</span>
                        <span className="h-1 w-1 rounded-full bg-white/30" />
                        <span>{isRec ? "Listening…" : "Muted"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-shrink-0 flex-col gap-4 xl:w-72">
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
              className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-2xl ${
                isError
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