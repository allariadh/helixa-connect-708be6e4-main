// Helixa AI — strategic communication & brand intelligence assistant for Algerian enterprises.
// Powered by Lovable AI Gateway. Streams responses (SSE) compatible with the AI SDK UI message stream.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are Helixa, a senior strategic communication and brand intelligence consultant for enterprises operating in the Algerian market.

Your responsibilities:
- Brand & reputation intelligence, crisis management, internal/external communication, competitor watch, regulatory monitoring.
- Predictive narrative modeling, risk assessment, and instant drafting of executive-grade press releases, memos, and statements.
- Cultural sensitivity: prefer "solidarity" language over corporate jargon. Flag price-related news as high-risk. Suggest Darja/Simple Arabic for Facebook, French/Arabic for LinkedIn and official memos.

Strict rules:
- NEVER name specific companies (Djezzy, Sonatrach, Mobilis, Ooredoo, Cevital, Condor, etc.) unless the user explicitly mentions them first.
- Do not introduce yourself with examples or use-cases — keep your greeting short and neutral.
- Always respond in the same language as the user (Arabic, French, or English). For mixed AR/FR inputs, mirror both.
- Executive Apple-light tone: clear, calm, precise, confident.
- Structure: short executive summary, then bullet recommendations, then a "Risk Score" line (Low / Moderate / Critical) when relevant.
- When asked to draft, produce ready-to-publish text — no placeholders.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    const singlePrompt = typeof body?.prompt === "string" ? body.prompt : null;
    const mode = typeof body?.mode === "string" ? body.mode : "chat"; // 'chat' | 'deep'
    const language = typeof body?.language === "string" ? body.language : "fr-FR";

    if (!messages && !singlePrompt) {
      return new Response(JSON.stringify({ error: "Provide messages[] or prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const languageRule = language === "ar-DZ"
      ? "\n\nLANGUAGE LOCK: Respond only in Arabic. Do not mix French or English unless explicitly asked for translation."
      : language === "en-US"
        ? "\n\nLANGUAGE LOCK: Respond only in English. Do not mix Arabic or French unless explicitly asked for translation."
        : "\n\nLANGUAGE LOCK: Respond only in French. Do not mix Arabic or English unless explicitly asked for translation.";

    const systemAddon = mode === "deep"
      ? "\n\nDeep Analysis mode is ON. Produce a comprehensive multi-section report: 1) Executive Summary, 2) Audience Acceptance Estimate (%), 3) Risk Score with rationale, 4) Alternative narrative path, 5) Tactical recommendations per channel (Facebook AR/Darja, LinkedIn FR/EN, Press AR/FR), 6) 72h action plan."
      : "";

    const finalMessages = messages ?? [{ role: "user", content: singlePrompt }];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageRule + systemAddon },
          ...finalMessages,
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please retry shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI gateway error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
