// src/services/helixaAgent.ts

export const HELIXA_CONSTITUTION = {
  market: "Algeria",
  // قاموس تلطيف الصدمات بناءً على الدستور المعرفي
  sensitiveTerms: {
    "زيادة": "تحيين",
    "رفع الأسعار": "مساهمة تضامنية لتطوير الخدمة",
    "ضريبة": "رسم تقني",
    "مشكلة": "تحدي تقني"
  },
  // توزيع اللغات حسب المنصات
  platforms: {
    facebook: { language: "Darja/Simple Arabic", preferred: "Facebook" },
    linkedin: { language: "English/French", preferred: "LinkedIn" }
  }
};

export class HelixaAgent {
  static analyze(text: string) {
    let riskScore = 0;
    let suggestions: string[] = [];
    let alternativePath = text;

    // 1. تحليل الحساسية الاقتصادية
    for (const [trigger, alternative] of Object.entries(HELIXA_CONSTITUTION.sensitiveTerms)) {
      if (text.includes(trigger)) {
        riskScore += 45; // قفزة فورية في عداد المخاطر
        alternativePath = alternativePath.replace(trigger, alternative);
        suggestions.push(`تم رصد مصطلح حساس "${trigger}". المقترح الاستراتيجي: استخدام "${alternative}".`);
      }
    }

    // 2. فحص المسؤولية الاجتماعية
    if (!text.includes("تضامن") && !text.includes("نلتزم")) {
      riskScore += 15;
      suggestions.push("نصيحة: افتقار النص لروح المسؤولية الاجتماعية. يُفضل إضافة لمسة تضامنية.");
    }

    return {
      risk: Math.min(riskScore, 100),
      alternativePath: alternativePath,
      recommendations: suggestions
    };
  }
}