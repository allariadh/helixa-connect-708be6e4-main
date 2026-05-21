// src/services/voiceService.ts
// Voice service — starts SpeechRecognition synchronously inside the user gesture
// so the browser actually grants the mic and connects to the speech endpoint.

type VoiceCallbacks = {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
};

export type VoiceLanguage = "ar-DZ" | "fr-FR" | "en-US";

const recognitionLocales: Record<VoiceLanguage, string[]> = {
  "ar-DZ": ["ar-DZ", "ar-SA", "ar"],
  "fr-FR": ["fr-FR", "fr"],
  "en-US": ["en-US", "en-GB", "en"],
};

const speechLocales: Record<VoiceLanguage, string[]> = {
  "ar-DZ": ["ar-DZ", "ar-SA", "ar"],
  "fr-FR": ["fr-FR", "fr-CA", "fr"],
  "en-US": ["en-US", "en-GB", "en"],
};

const feminineVoiceHints = [
  "aria", "jenny", "zira", "samantha", "victoria", "karen", "moira", "tessa", "veena",
  "susan", "serena", "sarah", "amelie", "audrey", "denise", "hortense", "julie", "celine",
  "hoda", "salma", "mariam", "laila", "layla", "fatima", "amina", "zeina", "nora",
];

const masculineVoiceHints = ["male", "man", "david", "mark", "daniel", "george", "fred", "alex", "thomas", "paul", "tarik", "maged", "majid"];

const preferredVoiceOrder: Record<VoiceLanguage, string[]> = {
  "en-US": ["aria", "jenny", "zira", "samantha", "victoria", "karen", "serena", "google uk english female"],
  "fr-FR": ["denise", "hortense", "julie", "audrey", "amelie", "celine", "aria"],
  "ar-DZ": ["hoda", "salma", "mariam", "laila", "layla", "fatima", "amina", "zeina", "nora", "aria"],
};

const getRecognitionCtor = (): (new () => any) | null => {
  const w = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const isSpeechRecognitionSupported = () => !!getRecognitionCtor();

const errorText = (code: string, lang: VoiceLanguage) => {
  const copy = {
    "ar-DZ": {
      unsupported: "التعرّف الصوتي غير متاح في هذا المتصفح. جرّب Chrome أو Edge.",
      network: "الميكروفون يعمل، لكن خدمة تحويل الصوت لم تتصل. اضغط مرة أخرى أو استخدم العربية من Chrome/Edge.",
      silent: "لم أسمعك بوضوح. اسمح للميكروفون وتكلم قريباً من الهاتف.",
      denied: "تم رفض الميكروفون. فعّله من إعدادات المتصفح.",
      start: "تعذر تشغيل الميكروفون. اضغط على الدائرة مرة أخرى.",
      generic: "حدث خطأ في الصوت. حاول مرة أخرى.",
    },
    "fr-FR": {
      unsupported: "La reconnaissance vocale n’est pas disponible dans ce navigateur. Essayez Chrome ou Edge.",
      network: "Le micro est actif, mais le service de dictée n’a pas répondu. Touchez encore une fois.",
      silent: "Je ne vous entends pas clairement. Autorisez le micro et parlez près du téléphone.",
      denied: "Micro refusé. Activez-le dans les paramètres du navigateur.",
      start: "Impossible de démarrer le micro. Touchez l’orbe encore une fois.",
      generic: "Erreur vocale. Réessayez.",
    },
    "en-US": {
      unsupported: "Voice recognition is not available in this browser. Try Chrome or Edge.",
      network: "The microphone is active, but dictation did not connect. Tap again or use Chrome/Edge.",
      silent: "I cannot hear you clearly. Allow the microphone and speak close to the phone.",
      denied: "Microphone denied. Enable it in browser settings.",
      start: "Could not start the microphone. Tap the orb once more.",
      generic: "Voice recognition error. Please try again.",
    },
  }[lang];
  return copy[code as keyof typeof copy] || copy.generic;
};

export const voiceService = {
  isSupported: isSpeechRecognitionSupported,

  speak: (text: string, lang: VoiceLanguage = "fr-FR") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredLocales = speechLocales[lang].map((locale) => locale.toLowerCase());
      const languageRoot = lang.slice(0, 2).toLowerCase();
      const matchingVoices = voices.filter((v) =>
        preferredLocales.some((locale) => v.lang.toLowerCase() === locale || v.lang.toLowerCase().startsWith(locale))
        || v.lang.toLowerCase().startsWith(languageRoot),
      );
      const isMasculine = (name: string) => masculineVoiceHints.some((hint) => name.toLowerCase().includes(hint));
      const ordered = preferredVoiceOrder[lang]
        .map((hint) => matchingVoices.find((v) => v.name.toLowerCase().includes(hint) && !isMasculine(v.name)))
        .find(Boolean);
      const feminine = matchingVoices.find((v) => feminineVoiceHints.some((hint) => v.name.toLowerCase().includes(hint)) && !isMasculine(v.name));
      const globalFeminine = voices.find((v) => feminineVoiceHints.some((hint) => v.name.toLowerCase().includes(hint)) && !isMasculine(v.name));
      const neutral = matchingVoices.find((v) => !isMasculine(v.name));
      utterance.voice = ordered || feminine || neutral || globalFeminine || matchingVoices[0] || voices[0] || null;
      utterance.lang = speechLocales[lang][0] || utterance.voice?.lang || lang;
      utterance.rate = lang.startsWith("ar") ? 0.9 : 0.95;
      utterance.pitch = 1.08;
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length) speakNow();
    else {
      window.speechSynthesis.onvoiceschanged = speakNow;
      setTimeout(speakNow, 300);
    }
  },

  stopSpeaking: () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  // IMPORTANT: synchronous — must be invoked directly inside a click handler.
  // Returns the recognition instance (or null on unsupported).
  listen: (callbacks: VoiceCallbacks, lang: VoiceLanguage = "fr-FR") => {
    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      callbacks.onError?.(errorText("unsupported", lang));
      return null;
    }

    let localeIndex = 0;
    let retryCount = 0;
    let finished = false;
    let restarting = false;

    const startWithLang = (voiceLang: VoiceLanguage) => {
      const recognition = new Recognition();
      const locale = recognitionLocales[voiceLang][localeIndex] || voiceLang;
      recognition.lang = locale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let gotResult = false;
      let latestTranscript = "";

      recognition.onresult = (event: any) => {
        if (finished) return;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          latestTranscript = event.results[i][0].transcript || latestTranscript;
          if (event.results[i].isFinal) {
            gotResult = true;
            finished = true;
            callbacks.onResult(latestTranscript.trim());
            try { recognition.stop?.(); } catch { /* noop */ }
          }
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if ((err === "network" || err === "language-not-supported") && localeIndex < recognitionLocales[voiceLang].length - 1) {
          localeIndex += 1;
          restarting = true;
          try { recognition.abort?.(); } catch { /* noop */ }
          setTimeout(() => { restarting = false; startWithLang(voiceLang); }, 120);
          return;
        }
        if ((err === "network" || err === "no-speech") && retryCount < 2) {
          retryCount += 1;
          restarting = true;
          try { recognition.abort?.(); } catch { /* noop */ }
          setTimeout(() => { restarting = false; startWithLang(voiceLang); }, 180);
          return;
        }
        if (err === "network") {
          callbacks.onError?.(errorText("network", voiceLang));
          return;
        }
        if (err === "no-speech") {
          callbacks.onError?.(errorText("silent", voiceLang));
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          callbacks.onError?.(errorText("denied", voiceLang));
          return;
        }
        if (err === "aborted") {
          return;
        }
        callbacks.onError?.(errorText("generic", voiceLang));
      };

      recognition.onend = () => {
        if (restarting) return;
        if (!gotResult && latestTranscript.trim() && !finished) {
          finished = true;
          callbacks.onResult(latestTranscript.trim());
        }
        callbacks.onEnd?.();
      };

      try {
        recognition.start();
        (currentRef as { instance: any }).instance = recognition;
      } catch (e) {
        callbacks.onError?.(errorText("start", voiceLang));
      }
    };

    const currentRef: { instance: any } = { instance: null };
    startWithLang(lang);

    // Return a stop-only handle so callers can cancel mid-listen.
    return {
      stop: () => {
        try { currentRef.instance?.stop?.(); } catch { /* noop */ }
      },
    };
  },
};
