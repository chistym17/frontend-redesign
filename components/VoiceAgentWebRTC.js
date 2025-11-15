/* -------------------------------------------------- *
 *  Sunrise Café — WebRTC voice client (FIXED)
 *  Properly receives JSON messages via data channel
 * -------------------------------------------------- */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic2, CheckCircle2, ShoppingCart, Gift, AlertCircle, X } from "lucide-react";

/* --------------------------  CONFIG  -------------------------- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";
const WEBRTC_OFFER_URL = process.env.NEXT_PUBLIC_WEBRTC_URL || "http://localhost:8000/api/webrtc/offer";

/* -----------------------  MAIN COMPONENT  --------------------- */
export default function VoiceAgentWebRTC() {
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

  const [assistants, setAssistants] = useState([]);
  const [assistantId, setAssistantId] = useState(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);

  const [sessionId, setSessionId] = useState(null);

  const [panels, setPanels] = useState({});
  const [activePanelId, setActivePanelId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [flowEnabled, setFlowEnabled] = useState(true);
  const [flowEvents, setFlowEvents] = useState([]);
  const [flowCurrent, setFlowCurrent] = useState(null);
  const [currentMode, setCurrentMode] = useState(null);
  const FLOW_MAX = 50;

  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  /* ---------------  REFS  ----------------- */
  const peerConnectionRef = useRef(null);
  const audioStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const remoteAudioRef = useRef(null);

  /* ======================== TOOL RESULT HELPERS ======================== */
  const unwrapToolData = (toolData) => {
    console.log("🔍 unwrapToolData INPUT:", JSON.stringify(toolData, null, 2));

    let payload = toolData?.result !== undefined ? toolData.result : toolData;
    console.log("📦 After result extraction:", JSON.stringify(payload, null, 2));

    while (payload?.data !== undefined && typeof payload.data === 'object') {
      payload = payload.data;
      console.log("🎁 After data unwrap:", JSON.stringify(payload, null, 2));
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const { meta, ok, tool, request, ...cleanData } = payload;
      console.log("✨ After stripping wrappers:", JSON.stringify(cleanData, null, 2));

      if (Object.keys(cleanData).length > 0) {
        return cleanData;
      }

      if (payload.error !== undefined) {
        return payload;
      }
    }

    console.log("🎯 Final return:", JSON.stringify(payload, null, 2));
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

  const guessKind = (payload) => {
    if (Array.isArray(payload)) return "table";
    if (Array.isArray(payload?.results) || Array.isArray(payload?.items)) return "table";
    
    if (payload && typeof payload === "object") {
      const keys = Object.keys(payload).filter(k => !["meta", "request", "ok", "data", "tool"].includes(k));
      
      if (payload.rates && typeof payload.rates === "object" && !Array.isArray(payload.rates)) return "kv-rates";
      if (payload.listing && typeof payload.listing === "object") return "card";
      if (payload.item && typeof payload.item === "object") return "card";
      
      const dataVals = keys.map(k => payload[k]).filter(v => v !== undefined);
      
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
  const handleMsg = useCallback((data) => {
    console.log("📨 WebRTC received:", data);

    // ---------- Bootstrap events ----------
    if (data.bootstrap && Array.isArray(data.events)) {
      console.log("Processing bootstrap events:", data.events.length);
      data.events.forEach((evt) => {
        if (evt.tool && evt.result) {
          const name = String(evt.tool || "update");
          const payloadObj = unwrapToolData(evt);
          const id = slug(name);

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
      console.log("📊 Flow event:", data.flow, data);
      setFlowEvents((evs) => [...evs, { ...data, ts: Date.now() }].slice(-FLOW_MAX));
      if (data.flow === "node" || data.flow === "init") {
        setFlowCurrent({ id: data.node_id, title: data.title || data.node_id });
      }
      if (data.flow === "mode") {
        setCurrentMode(data.mode || null);
        if (data.fallback) pushToast("Flow disabled — fell back to direct.");
      }
      return;
    }

    // ---------- Phase-1 shapes ----------
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
      console.log("🔧 Tool result:", data.tool);
      const name = String(data.tool || "update");
      const payloadObj = unwrapToolData(data);
      const id = slug(name);

      if (isToolError(payloadObj)) {
        const errMsg = getErrorMessage(payloadObj);
        pushToast(`${name}: ${errMsg}`, 5000, true);
        console.warn(`Tool error [${name}]:`, payloadObj);
        return;
      }

      upsertPanel(id, titleize(name), payloadObj);

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
  }, [activePanelId]);

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
        setAssistantId(initial);
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
          setAssistantId(created.id);
          if (typeof window !== "undefined") {
            localStorage.setItem("assistant_id", created.id);
          }
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
   *  ✅ FIXED: WebRTC Connection Setup with Data Channel Reception
   * ------------------------------------------------------------ */
  const connectWebSocket = async () => {
    if (loadingAssistant || !assistantId || !sessionId || isConnecting) return;
    
    try {
      setIsConnecting(true);
      setStatus("Connecting...");

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      audioStreamRef.current = stream;

      // Create peer connection
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming audio
      pc.ontrack = (event) => {
        console.log("🎵 Received remote track");
        const remoteStream = event.streams[0];
        
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = new Audio();
          remoteAudioRef.current.autoplay = true;
        }
        
        remoteAudioRef.current.srcObject = remoteStream;
      };

      // ═══════════════════════════════════════════════════════════════════
      // ✅ CRITICAL FIX: Set up data channel BEFORE creating offer
      // ═══════════════════════════════════════════════════════════════════
      const dc = pc.createDataChannel("messages", {
        ordered: true,
        maxRetransmits: 3
      });
      dataChannelRef.current = dc;
      
      dc.onopen = () => {
        console.log("✅ Data channel opened");
        setStatus("connected");
        setIsWsConnected(true);
        setIsConnecting(false);
        pushToast("WebRTC connected", 2000);
      };
      
      // ═══════════════════════════════════════════════════════════════════
      // ✅ CRITICAL FIX: Add onmessage handler to RECEIVE data
      // This was completely missing in the original code!
      // ═══════════════════════════════════════════════════════════════════
      dc.onmessage = (event) => {
        console.log("📥 Data channel received:", event.data);
        try {
          const data = JSON.parse(event.data);
          handleMsg(data);  // ← This processes tool results and flow events!
        } catch (e) {
          console.warn("Failed to parse data channel message:", e, event.data);
        }
      };
      
      dc.onclose = () => {
        console.log("📡 Data channel closed");
        disconnectWebSocket();
      };

      dc.onerror = (error) => {
        console.error("❌ Data channel error:", error);
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log("🔄 Connection state:", pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          disconnectWebSocket();
          setTimeout(() => {
            if (!isWsConnected && assistantId && sessionId) {
              connectWebSocket();
            }
          }, 2500);
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("📤 Sending offer to backend...");

      // Send offer to backend
      const response = await fetch(WEBRTC_OFFER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          assistant_id: assistantId,
          session_id: sessionId,
          mode: flowEnabled ? "flow" : "direct",
          ctx: "append",
          memory_limit: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to establish connection: ${response.statusText}`);
      }

      const { sdp: answerSdp } = await response.json();
      
      // Set remote description (answer from server)
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp
      });

      console.log("✅ WebRTC connection established, waiting for data channel...");
      
    } catch (error) {
      console.error("❌ WebRTC setup failed:", error);
      setStatus("Connection failed");
      setIsConnecting(false);
      setIsWsConnected(false);
      pushToast(`Connection failed: ${error.message}`, 5000, true);
      disconnectWebSocket();
    }
  };

  const disconnectWebSocket = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    
    setIsWsConnected(false);
    setIsConnecting(false);
    setIsRec(false);
    setStatus("Disconnected");
  };

  // Cleanup on component unmount or changes
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    if (peerConnectionRef.current) {
      disconnectWebSocket();
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
   *  RECORDING toggle (WebRTC auto-manages audio streaming)      *
   * ------------------------------------------------------------ */
  const toggleRec = async () => {
    if (!isWsConnected) {
      pushToast("Please connect first", 3000, true);
      return;
    }
    
    setIsRec(!isRec);
    
    if (!isRec) {
      pushToast("Listening...", 2000);
    }
  };

  /* -------------------------  UI pieces (unchanged)  ---------------------- */
  const CartPanel = () => (
    <div className="fixed inset-x-3 bottom-24 w-[72vw] max-w-[220px] sm:inset-auto sm:right-6 sm:bottom-[5rem] sm:w-72 sm:max-w-none z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-5 text-gray-800 shadow-2xl border border-gray-200/50 animate-in slide-in-from-bottom-4 sm:slide-in-from-right-5 duration-300 max-h-[28vh] sm:max-h-48 overflow-hidden text-[13px] sm:text-base">
      <h3 className="font-semibold mb-2 sm:mb-3 flex items-center text-gray-900">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2 sm:mr-3">
          <ShoppingCart size={14} className="text-emerald-600 sm:hidden" />
          <ShoppingCart size={16} className="text-emerald-600 hidden sm:block" />
        </div>
        <span className="text-sm sm:text-base">Shopping Cart</span>
      </h3>

      {!cart.length ? (
        <div className="text-center py-4 sm:py-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <ShoppingCart size={18} className="text-gray-400 sm:hidden" />
            <ShoppingCart size={24} className="text-gray-400 hidden sm:block" />
          </div>
          <p className="text-xs sm:text-sm text-gray-500">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2 max-h-[18vh] sm:max-h-48 overflow-y-auto">
          {cart.map((l, idx) => (
            <div key={l.item} className="flex justify-between items-center p-2 rounded-lg bg-gray-50/50 animate-in fade-in duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
              <span className="text-sm sm:text-base font-medium leading-tight">{l.qty}× {l.item}</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-[11px] sm:text-xs text-emerald-600 font-semibold">{l.qty}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {total && (
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Total</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-600">${total}</span>
          </div>
        </div>
      )}

      {submitted && (
        <div className="mt-2 sm:mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 animate-in slide-in-from-bottom-2">
          <p className="text-[12px] sm:text-sm text-emerald-700 flex items-center">
            <CheckCircle2 size={14} className="mr-2" />
            Order submitted successfully!
          </p>
        </div>
      )}
    </div>
  );

  const MenuPanel = () => (
    <div className="fixed left-6 top-24 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl p-5 text-gray-800 shadow-2xl border border-gray-200/50 max-h-[70vh] overflow-hidden animate-in slide-in-from-left-5 duration-300">
      <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
          <Gift size={16} className="text-emerald-600" />
        </div>
        Menu
      </h3>
      <div className="overflow-y-auto max-h-[calc(70vh-100px)] space-y-2">
        {menu.map((m, idx) => (
          <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-200 animate-in fade-in cursor-pointer group" style={{ animationDelay: `${idx * 50}ms` }}>
            <span className="font-medium text-gray-700 group-hover:text-gray-900">{m.name}</span>
            <span className="font-bold text-emerald-600 px-3 py-1 rounded-full bg-emerald-50">${m.price}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const OffersPanel = () => (
    <div className="fixed left-6 bottom-8 z-30 w-80 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-2xl border border-emerald-400/30 max-h-64 overflow-hidden animate-in slide-in-from-left-5 duration-300">
      <h3 className="font-semibold mb-4 flex items-center">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
          <Gift size={16} className="text-white" />
        </div>
        Special Offers
      </h3>
      <div className="overflow-y-auto max-h-40 space-y-2">
        {offers.map((o, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-in fade-in duration-200" style={{ animationDelay: `${i * 100}ms` }}>
            <p className="text-sm font-medium">{o.title}</p>
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

  const AssistantPicker = () => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-gray-700">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-sm font-medium">Assistant</span>
      </div>
      <select
        className="bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:bg-white min-w-[160px] appearance-none cursor-pointer"
        value={assistantId ?? ""}
        onChange={(e) => {
          const id = e.target.value || null;
          setAssistantId(id);
          if (typeof window !== "undefined") {
            if (id) localStorage.setItem("assistant_id", id);
            else localStorage.removeItem("assistant_id");
          }
        }}
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
  const FlowHUD = () => {
    if (!flowEnabled) return null;
    if (!flowEvents.length && !flowCurrent && !currentMode) return null;

    const nodes = flowEvents
      .filter((e) => e.flow === "node" || e.flow === "init")
      .map((e) => e.title || e.node_id)
      .filter(Boolean)
      .slice(-10);

    const funcs = [...new Set(flowEvents.filter((e) => e.flow === "register_function").map((e) => e.name))];

    return (
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-left-5 duration-300">
        <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-3"></div>
            Flow Monitor
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Current Node</div>
              <div className="font-semibold text-gray-900 truncate">{flowCurrent?.title || flowCurrent?.id || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-medium mb-1">Mode</div>
              <div className="font-semibold text-gray-900">{currentMode || (flowEnabled ? "flow" : "direct")}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase font-medium mb-2">Recent Path</div>
            {!nodes.length ? (
              <div className="text-gray-400 text-center py-4 text-sm">No path data</div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {nodes.map((n, i) => (
                  <React.Fragment key={i}>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        i === nodes.length - 1
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse"
                          : "bg-gray-100 border border-gray-200 text-gray-600"
                      }`}
                    >
                      {n}
                    </span>
                    {i < nodes.length - 1 && <span className="text-gray-300">→</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase font-medium mb-2">Functions</div>
            {!funcs.length ? (
              <div className="text-gray-400 text-center py-4 text-sm">No functions registered</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {funcs.map((f, idx) => (
                  <span key={f} className="text-xs px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 animate-in fade-in duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
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
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="text-red-700 font-semibold mb-2">Error</p>
          <p className="text-red-600 text-sm">{getErrorMessage(data)}</p>
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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500">No results found</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="text-left bg-gray-50/80">
                  <tr>
                    {cols.map((c) => (
                      <th key={c} className="py-3 px-4 font-semibold capitalize text-gray-700 border-b border-gray-200">
                        {c.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors duration-150 animate-in fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      {cols.map((c) => (
                        <td key={c} className="py-3 px-4 text-gray-600">
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
              className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200 hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-3" 
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-gray-700 font-medium">{k.replaceAll("_", " ")}</span>
              <span className="text-emerald-600 font-bold text-lg">{formatVal(v)}</span>
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
              className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-3" 
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-gray-700 font-medium capitalize">{k.replaceAll("_", " ")}</span>
              <span className="text-gray-900 font-semibold">{formatVal(v)}</span>
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
              className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/50 border border-purple-200 hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-3" 
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-gray-700 font-medium capitalize">{k.replaceAll("_", " ")}</span>
              <span className="text-gray-900 font-semibold">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    // fallback JSON
    const meaningfulKeys = Object.keys(data).filter(k => !["meta", "request", "ok", "data", "tool"].includes(k));
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        {meaningfulKeys.length > 0 && (
          <div className="text-xs text-gray-500 mb-3 font-mono">
            Raw Response (no structured format matched):
          </div>
        )}
        <pre className="text-xs whitespace-pre-wrap text-gray-700 font-mono overflow-auto max-h-96 bg-white p-3 rounded border border-gray-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  /* ================= DYNAMIC PANELS RENDERER ================= */
  const PanelTabs = ({ entries }) => {
    if (!entries.length) return null;
    const activeIdx = Math.max(0, entries.findIndex(([id]) => id === activePanelId));
    const [aId, aPanel] = entries[activeIdx] || entries[0];

    return (
      <div className="fixed left-1/2 -translate-x-1/2 top-32 z-30 w-[600px] max-h-[70vh] bg-white/95 backdrop-blur-md text-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 animate-in slide-in-from-top-5 duration-300">
        <div className="flex items-center overflow-x-auto gap-1 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
          {entries.map(([id, p], idx) => (
            <button
              key={id}
              onClick={() => setActivePanelId(id)}
              className={`px-4 py-2.5 text-sm rounded-xl whitespace-nowrap transition-all duration-200 font-medium animate-in fade-in ${
                id === aId 
                  ? "bg-emerald-500 text-white shadow-lg scale-105" 
                  : "text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm"
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
              title={p.title}
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={() => {
              setPanels({});
              setActivePanelId(null);
            }}
            className="ml-auto p-2 rounded-xl hover:bg-white text-gray-500 hover:text-gray-700 transition-all duration-200 hover:shadow-sm"
            title="Close all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-auto max-h-[58vh]">
          <GenericPanelBody panel={aPanel} />
        </div>
      </div>
    );
  };

  /* ---------------------------  MAIN RENDER  ----------------------- */
  return (
    <div className="min-h-screen relative overflow-hidden bg-green-100">
      {/* FLOATING CONTROLS */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-green/95 backdrop-blur-md rounded-2xl px-3 sm:px-6 py-3 shadow-2xl border border-gray-200/50 animate-in slide-in-from-top-5 duration-500 w-[calc(100vw-1.5rem)] sm:w-fit mx-auto">
        <AssistantPicker />
        
        <label className="flex items-center gap-2 text-gray-700 text-sm select-none cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={flowEnabled}
              onChange={(e) => setFlowEnabled(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${flowEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 mt-1 ${flowEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
            </div>
          </div>
          <span className="font-medium">Flow Mode</span>
        </label>

        <button
          onClick={isWsConnected ? disconnectWebSocket : connectWebSocket}
          className={`flex items-center space-x-3 rounded-2xl px-6 py-3 font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
            isWsConnected
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
          disabled={loadingAssistant || !assistantId || !sessionId || isConnecting}
          title={!sessionId ? "Resolving session..." : ""}
        >
          {isConnecting && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          )}
          <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
          <span>
            {isConnecting ? "Connecting..." : isWsConnected ? "Connected (WebRTC)" : "Connect"}
          </span>
        </button>

        <button
          onClick={toggleRec}
          className={`flex items-center space-x-3 rounded-2xl px-6 py-3 font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
            isRec 
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse" 
              : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200/50"
          }`}
          disabled={!isWsConnected}
        >
          <Mic2 size={18} className={isRec ? "animate-bounce" : ""} />
          <span>{isRec ? "Stop Talking" : "Start Talking"}</span>
        </button>
      </div>

      {/* PANELS */}
      {menu.length > 0 && <MenuPanel />}
      {offers.length > 0 && <OffersPanel />}
      <CartPanel />

      {/* Flow HUD */}
      <FlowHUD />

      {/* Dynamic panels */}
      <PanelTabs entries={Object.entries(panels).sort((a, b) => a[1].ts - b[1].ts)} />

      {/* OVERLAYS */}
      {thankYou && <ThankYouCard />}
      {complaintOk && <ComplaintToast />}

      {/* Enhanced toasts */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-3 items-center max-w-md">
        {toasts.map((t, idx) => {
          const isError = t.isError;
          return (
            <div
              key={t.id}
              className={`w-full px-6 py-3 rounded-2xl flex items-center shadow-2xl border animate-in slide-in-from-bottom-5 duration-300 ${
                isError
                  ? "bg-red-500/95 backdrop-blur-md text-white border-red-400/30"
                  : "bg-emerald-500/95 backdrop-blur-md text-white border-emerald-400/30"
              }`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isError 
                  ? "bg-white/20" 
                  : "bg-white/20"
              }`}>
                {isError ? (
                  <AlertCircle size={16} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                )}
              </div>
              <span className="font-medium text-sm">{t.text}</span>
            </div>
          );
        })}
      </div>

      {/* STATUS */}
      <div className="fixed bottom-6 right-6 text-xs text-gray-600 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl z-20 border border-gray-200/50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span>
            WebRTC: {status}
            {assistantId ? ` · ${assistantId.slice(0, 8)}…` : ""}
            {isWsConnected ? " · Connected" : " · Offline"}
            {` · ${currentMode || (flowEnabled ? "flow" : "direct")}`}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 bg-clip-text text-transparent">
              AI Voice Agent (WebRTC)
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience crystal-clear voice interactions with WebRTC technology. 
              Low-latency, high-quality audio streaming for seamless conversations.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16">
            {[
              { icon: "🤖", text: "Select Assistant", delay: "0ms" },
              { icon: "🔗", text: "Connect WebRTC", delay: "200ms" },
              { icon: "🎤", text: "Start Speaking", delay: "400ms" }
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: step.delay }}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-xl shadow-lg">
                  {step.icon}
                </div>
                <span className="text-gray-700 font-medium">{step.text}</span>
                {idx < 2 && <div className="hidden sm:block w-8 h-0.5 bg-gradient-to-r from-emerald-300 to-gray-300 rounded ml-4"></div>}
              </div>
            ))}
          </div>

          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>
      </div>
    </div>
  );
}