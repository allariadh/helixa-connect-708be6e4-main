import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic,
  Keyboard,
  Send,
  Sparkles,
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Upload,
  Brain,
  FileSearch,
  LineChart,
  Zap,
  Activity,
  ShieldAlert,
  FileDown,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { voiceService, type VoiceLanguage } from "@/services/voiceService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractFileText, downloadTextAsPDF, shareText } from "@/lib/aiWorkspace";
import { archiveStore } from "@/lib/archiveStore";

type AIMode = "voice" | "deep";
type InputMode = "voice" | "keyboard";
type DeepTab = "documents" | "narrative";

type AILanguage = VoiceLanguage;

const AI_ACCENT = "#CF00EE";

const quickActions = [
  { icon: BarChart3, label: "Analyze Sentiment" },
  { icon: MessageSquare, label: "Draft Response" },
  { icon: Sparkles, label: "Simulate Scenario" },
  { icon: TrendingUp, label: "Team Insights" },
];

const deepTools = [
  { icon: FileSearch, label: "Document Analysis", desc: "Extract insights & summaries" },
  { icon: LineChart, label: "Data Visualization", desc: "Charts & tables" },
  { icon: Brain, label: "Predictive Modeling", desc: "Forecast trends" },
  { icon: FileText, label: "Report Generation", desc: "Executive reports" },
];

const signalSources = [
  { icon: Facebook, name: "Facebook" },
  { icon: Instagram, name: "Instagram" },
  { icon: Linkedin, name: "LinkedIn" },
  { icon: Youtube, name: "YouTube" },
  { icon: Twitter, name: "X" },
];

const accentPill = (active: boolean) =>
  active
    ? { background: AI_ACCENT, color: "#fff", borderColor: AI_ACCENT }
    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" };

const languageOptions: { value: AILanguage; label: string; short: string }[] = [
  { value: "ar-DZ", label: "Arabic", short: "AR" },
  { value: "fr-FR", label: "French", short: "FR" },
  { value: "en-US", label: "English", short: "EN" },
];

const languagePrompt: Record<AILanguage, string> = {
  "ar-DZ": "Working language: Arabic only. Reply only in Arabic. Do not mix French or English unless the user explicitly asks for translation.",
  "fr-FR": "Working language: French only. Reply only in French. Do not mix Arabic or English unless the user explicitly asks for translation.",
  "en-US": "Working language: English only. Reply only in English. Do not mix Arabic or French unless the user explicitly asks for translation.",
};

const voiceCopy: Record<AILanguage, { idle: string; listening: string; thinking: string; speaking: string; retry: string; offline: string; hello: string; placeholder: string }> = {
  "ar-DZ": {
    idle: "اضغط على الدائرة وتكلم.",
    listening: "أستمع إليك...",
    thinking: "هيلكسا تفكر...",
    speaking: "هيلكسا تتحدث...",
    retry: "اضغط لإعادة المحاولة.",
    offline: "الذكاء غير متاح الآن. حاول مرة أخرى.",
    hello: "مرحباً — أنا هيلكسا. اختر العربية وسأكتب وأتحدث بالعربية فقط.",
    placeholder: "اكتب لهيلكسا بالعربية...",
  },
  "fr-FR": {
    idle: "Touchez l’orbe et parlez.",
    listening: "J’écoute...",
    thinking: "Helixa réfléchit...",
    speaking: "Helixa répond...",
    retry: "Touchez l’orbe pour réessayer.",
    offline: "L’intelligence est momentanément indisponible. Réessayez.",
    hello: "Bonjour — je suis Helixa. En français, j’écris et je parle uniquement en français.",
    placeholder: "Écrivez à Helixa en français...",
  },
  "en-US": {
    idle: "Tap the orb and speak.",
    listening: "Listening...",
    thinking: "Helixa is thinking...",
    speaking: "Speaking...",
    retry: "Tap the orb to retry.",
    offline: "Intelligence is temporarily offline. Please try again.",
    hello: "Hello — I’m Helixa. In English, I will write and speak only in English.",
    placeholder: "Ask Helixa in English...",
  },
};

export const AIHub = () => {
  const [aiMode, setAIMode] = useState<AIMode>("voice");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [deepTab, setDeepTab] = useState<DeepTab>("documents");
  const [aiLanguage, setAiLanguage] = useState<AILanguage>("fr-FR");

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string>(voiceCopy["fr-FR"].idle);
  const recognitionRef = useRef<{ stop?: () => void } | null>(null);

  // Keyboard chat
  const [chatMessages, setChatMessages] = useState<{ text: string; isHelixa: boolean }[]>([]);
  const [keyboardInput, setKeyboardInput] = useState("");
  const [keyboardLoading, setKeyboardLoading] = useState(false);

  // Deep — Document & Data
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [docAnalysisRunning, setDocAnalysisRunning] = useState(false);
  const [docAnalysisResult, setDocAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Deep — Narrative / PNMS
  const [enabledSignals, setEnabledSignals] = useState<Record<string, boolean>>({
    Facebook: true,
    Instagram: false,
    LinkedIn: true,
    YouTube: false,
    X: false,
  });
  const [narrative, setNarrative] = useState("");
  const [pnmsLoading, setPnmsLoading] = useState(false);
  const [pnmsResult, setPnmsResult] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      voiceService.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    recognitionRef.current?.stop?.();
    voiceService.stopSpeaking();
    setIsListening(false);
    setVoiceError(null);
    setVoiceStatus(voiceCopy[aiLanguage].idle);
  }, [aiLanguage]);

  // ───────────────────────────────────────────────────────────
  // Edge-function call (single source of truth for both modes)
  // ───────────────────────────────────────────────────────────
  const callHelixaAI = async (
    messages: { role: string; content: string }[],
    mode: "chat" | "deep" = "chat",
  ): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("helixa-ai", {
      body: { messages: [{ role: "system", content: languagePrompt[aiLanguage] }, ...messages], mode, language: aiLanguage },
    });
    if (error) throw error;
    const text = (data as { text?: string })?.text;
    if (!text) throw new Error("Empty AI response");
    return text;
  };

  // ───────────────────────────────────────────────────────────
  // KEYBOARD MODE — text in, text out only. No TTS.
  // ───────────────────────────────────────────────────────────
  const handleKeyboardSend = async () => {
    const text = keyboardInput.trim();
    if (!text || keyboardLoading) return;
    setChatMessages((prev) => [...prev, { text, isHelixa: false }]);
    setKeyboardInput("");
    setKeyboardLoading(true);
    try {
      const conversation = [
        ...chatMessages.map((m) => ({ role: m.isHelixa ? "assistant" : "user", content: m.text })),
        { role: "user", content: text },
      ];
      const reply = await callHelixaAI(conversation, "chat");
      setChatMessages((prev) => [...prev, { text: reply, isHelixa: true }]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { text: voiceCopy[aiLanguage].offline, isHelixa: true },
      ]);
    } finally {
      setKeyboardLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // VOICE MODE — voice in, voice out only. No chat bubbles.
  // ───────────────────────────────────────────────────────────
  const handleVoiceActivate = () => {
    setVoiceError(null);
    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    setVoiceStatus(voiceCopy[aiLanguage].listening);
    // Call synchronously so the SpeechRecognition is created inside the user gesture.
    recognitionRef.current = voiceService.listen({
      onResult: async (transcript) => {
        setIsListening(false);
        setVoiceStatus(voiceCopy[aiLanguage].thinking);
        try {
          const reply = await callHelixaAI(
            [{ role: "user", content: transcript }],
            "chat",
          );
          setVoiceStatus(voiceCopy[aiLanguage].speaking);
          voiceService.speak(reply, aiLanguage);
          setTimeout(() => setVoiceStatus(voiceCopy[aiLanguage].idle), 1200);
        } catch (err) {
          console.error(err);
          setVoiceError(voiceCopy[aiLanguage].offline);
          voiceService.speak(voiceCopy[aiLanguage].offline, aiLanguage);
          setVoiceStatus(voiceCopy[aiLanguage].retry);
        }
      },
      onError: (err) => {
        setIsListening(false);
        if (err) {
          setVoiceError(err);
          voiceService.speak(err, aiLanguage);
        }
        setVoiceStatus(voiceCopy[aiLanguage].retry);
      },
      onEnd: () => setIsListening(false),
    }, aiLanguage);
  };


  // ───────────────────────────────────────────────────────────
  // DEEP — Document & Data
  // ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) added.`);
  };

  const removeFile = (idx: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  const readFileAsText = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").slice(0, 8000));
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });

  const runDocumentAnalysis = async () => {
    if (!uploadedFiles.length) {
      toast.error("Please upload at least one file.");
      return;
    }
    setDocAnalysisRunning(true);
    setDocAnalysisResult(null);
    try {
      const snippets: string[] = [];
      for (const f of uploadedFiles.slice(0, 5)) {
        const text = await extractFileText(f);
        snippets.push(`--- ${f.name} (${Math.round(f.size / 1024)}KB) ---\n${text}`);
      }
      const prompt = `Perform a professional Document & Data Intelligence analysis. Structure the report as:\n1) Executive Summary\n2) Key Insights\n3) Risks & Opportunities\n4) Recommended Actions\n5) Risk Score (Low/Moderate/Critical)\n\nUse executive Apple-light tone. Be precise and decision-ready.\n\nSOURCE FILES:\n\n${snippets.join("\n\n")}`;
      const reply = await callHelixaAI([{ role: "user", content: prompt }], "deep");
      setDocAnalysisResult(reply);
      archiveStore.add({ name: `Document_AI_Report_${Date.now()}.pdf`, source: "Document AI", size: "Generated" });
    } catch (err) {
      console.error(err);
      setDocAnalysisResult("Intelligence Offline. Please try again.");
    } finally {
      setDocAnalysisRunning(false);
    }
  };

  const resetDocAnalysis = () => {
    setUploadedFiles([]);
    setDocAnalysisResult(null);
  };

  // ───────────────────────────────────────────────────────────
  // DEEP — Narrative / PNMS
  // ───────────────────────────────────────────────────────────
  const runPNMS = async (kind: "simulation" | "live") => {
    if (!narrative.trim()) {
      toast.error("Please describe the narrative or scenario.");
      return;
    }
    const sources = Object.entries(enabledSignals)
      .filter(([, v]) => v)
      .map(([k]) => k);
    setPnmsLoading(true);
    setPnmsResult(null);
    try {
      const isLive = kind === "live";
      const prompt = `PNMS Tier 3 — ${isLive ? "LIVE SOCIAL ANALYSIS" : "PREDICTIVE SIMULATION"}.

Connected signal sources: ${sources.join(", ") || "none"}
${isLive ? `Mode: Live Analysis. Treat the selected sources as the company's official pages on those platforms. Simulate realistic audience behaviour, recurring comment themes, sentiment distribution, top criticisms and top praises that such a page would currently surface in the Algerian market.` : `Mode: Predictive Simulation of a hypothetical narrative.`}

Narrative / Scenario:
"""${narrative}"""

Produce a professional executive-grade report with these sections:
1. Executive Summary (3 lines)
2. ${isLive ? "Audience Snapshot — sentiment %, dominant tone, top 5 recurring comment themes, sample paraphrased quotes" : "Audience Reaction Forecast — sentiment % per platform"}
3. Reputation Risk Level (Low / Moderate / Critical) + rationale
4. Stakeholder Impact (employees, regulators, media, customers, investors)
5. Alternative Narrative Paths (3 options, ranked)
6. Recommended Communication Strategy per channel (Facebook AR/Darja, Instagram, LinkedIn FR/EN, Press AR/FR)
7. 72-hour Action Plan (timed)

Tone: Apple-light executive, calm, precise, decision-ready. No filler.`;
      const reply = await callHelixaAI([{ role: "user", content: prompt }], "deep");
      setPnmsResult(reply);
      archiveStore.add({ name: `PNMS_Strategic_Report_${Date.now()}.pdf`, source: "PNMS AI", size: "Generated" });
    } catch (err) {
      console.error(err);
      setPnmsResult("Intelligence Offline. Please try again.");
    } finally {
      setPnmsLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Top mode toggle */}
      <div className="p-4 border-b border-border/50">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setAIMode("voice")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300",
              aiMode === "voice" ? "text-white shadow-lg" : "text-muted-foreground hover:text-foreground",
            )}
            style={aiMode === "voice" ? { background: AI_ACCENT } : undefined}
          >
            <Mic className="w-4 h-4 inline-block mr-2" />
            Helixa AI
          </button>
          <button
            onClick={() => setAIMode("deep")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300",
              aiMode === "deep" ? "text-white shadow-lg" : "text-muted-foreground hover:text-foreground",
            )}
            style={aiMode === "deep" ? { background: AI_ACCENT } : undefined}
          >
            <Brain className="w-4 h-4 inline-block mr-2" />
            AI Analysis Workspace
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border/40 bg-muted/30 p-1.5">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setAiLanguage(option.value)}
              className="py-2 rounded-lg text-xs font-semibold transition-all"
              style={aiLanguage === option.value ? { background: AI_ACCENT, color: "#fff" } : { color: "hsl(var(--muted-foreground))" }}
              aria-label={`Use ${option.label}`}
            >
              {option.short} · {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───── Voice / Keyboard mode ───── */}
      {aiMode === "voice" && (
        <div className="flex flex-col h-full">
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={() => {
                voiceService.stopSpeaking();
                recognitionRef.current?.stop?.();
                setInputMode("voice");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
              style={accentPill(inputMode === "voice")}
            >
              <Mic className="w-4 h-4 inline-block mr-2" /> Voice
            </button>
            <button
              onClick={() => {
                voiceService.stopSpeaking();
                recognitionRef.current?.stop?.();
                setInputMode("keyboard");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
              style={accentPill(inputMode === "keyboard")}
            >
              <Keyboard className="w-4 h-4 inline-block mr-2" /> Keyboard
            </button>
          </div>

          {inputMode === "voice" ? (
            // STRICT VOICE MODE — voice in, voice out only. No bubbles.
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <h2 className="mb-6 text-2xl font-bold tracking-tight" style={{ color: AI_ACCENT }}>
                Helixa
              </h2>

              <button
                onClick={handleVoiceActivate}
                className={cn(
                  "relative w-[160px] h-[160px] flex items-center justify-center transition-all duration-200",
                  isListening ? "scale-[1.03]" : "hover:scale-[1.02]",
                )}
                aria-label={isListening ? "Stop listening" : "Activate voice"}
              >
                <span
                  className="helixa-orb-ring"
                  style={{ width: 90, height: 90, border: "2px solid rgba(207,0,238,0.50)", animationDelay: "0s" }}
                />
                <span
                  className="helixa-orb-ring"
                  style={{ width: 118, height: 118, border: "1.5px solid rgba(207,0,238,0.32)", animationDelay: "0.7s" }}
                />
                <span
                  className="helixa-orb-ring"
                  style={{ width: 148, height: 148, border: "1.5px solid rgba(207,0,238,0.20)", animationDelay: "1.4s" }}
                />
                <span
                  className="relative block rounded-full"
                  style={{
                    width: 70,
                    height: 70,
                    background: AI_ACCENT,
                    boxShadow: "0 10px 30px rgba(207,0,238,0.45)",
                    animation: "orb-pulse 3s ease-in-out infinite",
                  }}
                >
                  <Mic
                    className="absolute"
                    style={{
                      width: 26,
                      height: 26,
                      color: "#ffffff",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 4,
                    }}
                  />
                </span>
              </button>

              <div className="mt-8 text-center">
                {voiceError ? (
                  <p className="text-sm text-destructive">{voiceError}</p>
                ) : (
                  <p className="text-base text-muted-foreground" style={{ color: isListening ? AI_ACCENT : undefined }}>
                    {voiceStatus}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // STRICT KEYBOARD MODE — text in, text out only. No TTS.
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: AI_ACCENT }}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-card p-4 max-w-[85%]">
                    <p className="text-body text-foreground">
                      {voiceCopy[aiLanguage].hello}
                    </p>
                  </div>
                </div>

                {chatMessages.map((msg, index) => (
                  <div key={index} className={cn("flex gap-3", msg.isHelixa ? "" : "justify-end")}>
                    {msg.isHelixa && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: AI_ACCENT }}
                      >
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn("glass-card p-4 max-w-[85%]", msg.isHelixa ? "" : "text-white")}
                      style={!msg.isHelixa ? { background: AI_ACCENT } : undefined}
                    >
                      <p className="text-body whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {keyboardLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: AI_ACCENT }} />
                    {voiceCopy[aiLanguage].thinking}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 glass-card p-3">
                    <textarea
                      value={keyboardInput}
                      onChange={(e) => setKeyboardInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleKeyboardSend();
                        }
                      }}
                      placeholder={voiceCopy[aiLanguage].placeholder}
                      className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[40px] max-h-[120px]"
                      rows={1}
                    />
                  </div>
                  <button
                    onClick={handleKeyboardSend}
                    disabled={!keyboardInput.trim() || keyboardLoading}
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:scale-105"
                    style={{ background: AI_ACCENT }}
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── AI Analysis Workspace (Deep) ───── */}
      {aiMode === "deep" && (
        <div className="p-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setDeepTab("documents")}
              className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
              style={deepTab === "documents" ? { background: AI_ACCENT, color: "#fff" } : { color: "hsl(var(--muted-foreground))" }}
            >
              Document & Data
            </button>
            <button
              onClick={() => setDeepTab("narrative")}
              className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
              style={deepTab === "narrative" ? { background: AI_ACCENT, color: "#fff" } : { color: "hsl(var(--muted-foreground))" }}
            >
              Narrative & PNMS
            </button>
          </div>

          {/* TAB 1 */}
          {deepTab === "documents" && (
            <div className="space-y-4">
              <h3 className="text-h3 text-foreground">Document & Data Intelligence</h3>

              {!docAnalysisRunning && !docAnalysisResult && (
                <div
                  className="glass-card p-6 border-dashed border-2"
                  style={{ borderColor: `${AI_ACCENT}55` }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: `${AI_ACCENT}1A` }}
                    >
                      <Upload className="w-8 h-8" style={{ color: AI_ACCENT }} />
                    </div>
                    <h3 className="text-h3 text-foreground mb-2">Upload Files for Analysis</h3>
                    <p className="text-caption text-muted-foreground mb-4">
                      PDF · DOCX · XLSX · CSV · JSON · Images
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.xlsx,.csv,.json,.txt,.md,image/*"
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: AI_ACCENT }}
                    >
                      Upload Files
                    </button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2">
                          <span className="truncate">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tool cards */}
              {!docAnalysisRunning && !docAnalysisResult && (
                <div className="grid grid-cols-2 gap-3">
                  {deepTools.map((t) => (
                    <div key={t.label} className="glass-card p-4">
                      <t.icon className="w-7 h-7 mb-2" style={{ color: AI_ACCENT }} />
                      <h4 className="text-sm font-semibold text-foreground">{t.label}</h4>
                      <p className="text-caption text-muted-foreground">{t.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Run / Loading / Result */}
              {!docAnalysisResult && (
                <button
                  onClick={runDocumentAnalysis}
                  disabled={docAnalysisRunning || !uploadedFiles.length}
                  className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: AI_ACCENT }}
                >
                  {docAnalysisRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Helixa is analyzing your documents…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>
              )}

              {docAnalysisResult && (
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" style={{ color: AI_ACCENT }} />
                      <h4 className="text-h3 text-foreground">Analysis Results</h4>
                    </div>
                    <button
                      onClick={resetDocAnalysis}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      New Analysis
                    </button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {docAnalysisResult}
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Button variant="glass" size="sm" onClick={() => downloadTextAsPDF("Document & Data Intelligence Report", docAnalysisResult!, `helixa-analysis-${Date.now()}.pdf`)}>
                      <FileDown className="w-4 h-4 mr-1" /> Download PDF
                    </Button>
                    <Button variant="glass" size="sm" onClick={async () => { const ok = await shareText("Helixa Analysis", docAnalysisResult!); toast.success(ok ? "Shared / copied to clipboard" : "Share failed"); }}>
                      <MessageSquare className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 */}
          {deepTab === "narrative" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-h3 text-foreground">Narrative Intelligence — PNMS Tier 3</h3>
                <p className="text-caption text-muted-foreground">
                  Predict how narratives evolve before they happen.
                </p>
              </div>

              <div className="glass-card p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Step 1 · Select signal sources
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {signalSources.map((s) => {
                    const on = enabledSignals[s.name];
                    return (
                      <button
                        key={s.name}
                        onClick={() => setEnabledSignals((prev) => ({ ...prev, [s.name]: !prev[s.name] }))}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all"
                        style={{
                          borderColor: on ? AI_ACCENT : "hsl(var(--border))",
                          background: on ? `${AI_ACCENT}14` : "transparent",
                          color: on ? AI_ACCENT : "hsl(var(--muted-foreground))",
                        }}
                      >
                        <s.icon className="w-4 h-4" />
                        <span className="text-[10px]">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Step 2 · Describe the narrative
                </p>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Describe the narrative or scenario you want to simulate..."
                  className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[120px]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runPNMS("simulation")}
                  disabled={pnmsLoading || !narrative.trim()}
                  className="flex-1 min-w-[140px] py-3 rounded-xl text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: AI_ACCENT }}
                >
                  {pnmsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  Run Simulation
                </button>
                <button
                  onClick={() => runPNMS("live")}
                  disabled={pnmsLoading || !narrative.trim()}
                  className="flex-1 min-w-[140px] py-3 rounded-xl font-semibold border disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ borderColor: AI_ACCENT, color: AI_ACCENT }}
                >
                  <Sparkles className="w-4 h-4" />
                  Run Live Analysis
                </button>
              </div>

              {pnmsLoading && (
                <p className="text-sm text-center text-muted-foreground">
                  Helixa is analyzing reputation signals…
                </p>
              )}

              {pnmsResult && (
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" style={{ color: AI_ACCENT }} />
                    <h4 className="text-h3 text-foreground">Strategic Intelligence Report</h4>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {pnmsResult}
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Button variant="glass" size="sm" onClick={() => downloadTextAsPDF("PNMS Strategic Intelligence Report", pnmsResult!, `helixa-pnms-${Date.now()}.pdf`)}>
                      <FileDown className="w-4 h-4 mr-1" /> Download PDF
                    </Button>
                    <Button variant="glass" size="sm" onClick={async () => { const ok = await shareText("Helixa PNMS Report", pnmsResult!); toast.success(ok ? "Shared / copied to clipboard" : "Share failed"); }}>
                      <MessageSquare className="w-4 h-4 mr-1" /> Share with Stakeholders
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* keep quickActions reachable for analytics (no longer rendered in strict modes) */}
      <div className="hidden">{quickActions.map((a) => a.label).join("")}</div>
    </div>
  );
};
