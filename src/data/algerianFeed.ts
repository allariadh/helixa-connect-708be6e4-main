// Bilingual (AR + FR + EN) Algerian enterprise sample content for HomeFeed and demos.

export type FeedCategory =
  | "regulatory"
  | "competitor"
  | "launch"
  | "internal_memo"
  | "culture";

export interface AlgerianPost {
  id: string;
  author: { name: string; title: string; department: string; avatar: string };
  content: string;
  category: FeedCategory;
  type: "announcement" | "update" | "event" | "achievement";
  timestamp: string;
  reactions: { likes: number; celebrates: number; supports: number; insights: number };
  comments: number;
  views: number;
  hasImage?: boolean;
  visibilityTier?: "COMPANY_WIDE" | "ROLE_RESTRICTED" | "DEPT_ONLY";
  allowComments?: boolean;
  allowShare?: boolean;
}

export const categoryLabels: Record<FeedCategory, { fr: string; ar: string }> = {
  regulatory: { fr: "Réglementaire", ar: "تنظيمي" },
  competitor: { fr: "Veille concurrentielle", ar: "رصد المنافسين" },
  launch: { fr: "Lancement produit", ar: "إطلاق منتج" },
  internal_memo: { fr: "Mémo interne", ar: "مذكرة داخلية" },
  culture: { fr: "Culture d'entreprise", ar: "ثقافة المؤسسة" },
};

export const algerianPosts: AlgerianPost[] = [
  {
    id: "dz-1",
    author: {
      name: "Direction Générale — Helixa DZ",
      title: "Comité Exécutif",
      department: "Executive",
      avatar: "DG",
    },
    content:
      "📌 Décret exécutif n°25-117 publié par le Ministère de la Poste et des Télécommunications : nouvelles obligations de transparence pour les opérateurs B2B. Notre cellule juridique prépare une note de cadrage interne d'ici 48h.\n\nمذكرة تنظيمية: نشر المرسوم التنفيذي رقم 25-117 — على جميع الفرق التجارية مراجعة بنود الشفافية الجديدة قبل نهاية الأسبوع.",
    category: "regulatory",
    type: "announcement",
    timestamp: "1h",
    reactions: { likes: 58, celebrates: 4, supports: 21, insights: 33 },
    comments: 12,
    views: 412,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: false,
  },
  {
    id: "dz-2",
    author: {
      name: "Veille Marché — Cellule Intelligence",
      title: "Brand Intelligence",
      department: "Strategy",
      avatar: "VM",
    },
    content:
      "🔎 Djezzy vient d'annoncer une nouvelle offre Entreprise « Business Connect Pro » avec engagement 24 mois. Impact estimé sur Mobilis et Ooredoo : +12% de pression tarifaire sur le segment PME.\n\nرصد: أطلقت جيزي عرضاً جديداً للمؤسسات — نوصي بإعداد رد استراتيجي خلال 72 ساعة لحماية حصتنا السوقية.",
    category: "competitor",
    type: "update",
    timestamp: "3h",
    reactions: { likes: 41, celebrates: 2, supports: 14, insights: 47 },
    comments: 19,
    views: 526,
    visibilityTier: "ROLE_RESTRICTED",
    allowComments: true,
    allowShare: false,
  },
  {
    id: "dz-3",
    author: {
      name: "Condor Electronics",
      title: "Product Marketing Lead",
      department: "Marketing",
      avatar: "CE",
    },
    content:
      "🚀 Lancement officiel du C-Smart Pro le 15 du mois prochain à Alger. Press kit FR/AR finalisé, embargo médias jusqu'au J-3. Rollout interne : briefing forces de vente lundi.\n\nإطلاق هاتف C-Smart Pro الشهر القادم — مجموعة المراسلات الصحفية جاهزة بالعربية والفرنسية.",
    category: "launch",
    type: "event",
    timestamp: "5h",
    reactions: { likes: 87, celebrates: 51, supports: 9, insights: 12 },
    comments: 24,
    hasImage: true,
    views: 731,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: true,
  },
  {
    id: "dz-4",
    author: {
      name: "CEO Office",
      title: "Bureau du Président-Directeur Général",
      department: "Executive",
      avatar: "PDG",
    },
    content:
      "Mémo exécutif — All Staff : à compter du 1er du mois, la nouvelle politique de gouvernance entre en vigueur. Merci à chaque manager de relayer auprès de ses équipes.\n\nمذكرة من المدير العام: تدخل سياسة الحوكمة الجديدة حيز التنفيذ بداية الشهر القادم. الرجاء من كل مسؤول إبلاغ فريقه.",
    category: "internal_memo",
    type: "announcement",
    timestamp: "Yesterday",
    reactions: { likes: 124, celebrates: 12, supports: 38, insights: 9 },
    comments: 41,
    views: 1284,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: false,
  },
  {
    id: "dz-5",
    author: {
      name: "Ressources Humaines",
      title: "Engagement Collaborateurs",
      department: "HR",
      avatar: "RH",
    },
    content:
      "🎉 Bravo aux 38 collaborateurs certifiés ce trimestre dans le programme « Excellence Communication ». Cérémonie de remise le jeudi à 16h, siège Alger.\n\nتهانينا لـ 38 موظفاً تحصلوا على شهادة برنامج التميّز في التواصل هذا الفصل.",
    category: "culture",
    type: "achievement",
    timestamp: "2 days",
    reactions: { likes: 96, celebrates: 64, supports: 22, insights: 4 },
    comments: 18,
    views: 612,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: true,
  },
];

export const regulatoryFeed = [
  {
    id: "reg-1",
    title: "Décret exécutif n°25-117 — Transparence télécoms",
    titleAr: "المرسوم التنفيذي رقم 25-117 — شفافية الاتصالات",
    source: "Journal Officiel",
    date: "Aujourd'hui",
    impact: "High",
  },
  {
    id: "reg-2",
    title: "Arrêté ministériel — Étiquetage produits importés",
    titleAr: "قرار وزاري — وسم المنتجات المستوردة",
    source: "Ministère du Commerce",
    date: "Hier",
    impact: "Medium",
  },
  {
    id: "reg-3",
    title: "Circulaire Banque d'Algérie — Reporting trimestriel",
    titleAr: "تعميم بنك الجزائر — التقارير الفصلية",
    source: "Banque d'Algérie",
    date: "3 j.",
    impact: "Medium",
  },
];

export const competitorFeed = [
  { id: "c1", company: "Djezzy", action: "Lance offre B2B « Business Connect Pro »", signal: "Pression tarifaire" },
  { id: "c2", company: "Mobilis", action: "Annonce partenariat 5G avec Sonatrach", signal: "Alliance stratégique" },
  { id: "c3", company: "Ooredoo", action: "Refonte plateforme self-care entreprise", signal: "Digital UX" },
  { id: "c4", company: "Cevital", action: "Acquisition usine de transformation à Béjaïa", signal: "Expansion industrielle" },
];

export const launchTimeline = [
  { id: "t1", step: "Validation product-market fit", status: "done", date: "J-21" },
  { id: "t2", step: "Press kit FR/AR finalisé", status: "done", date: "J-14" },
  { id: "t3", step: "Briefing forces de vente", status: "in_progress", date: "J-7" },
  { id: "t4", step: "Embargo médias levé", status: "pending", date: "J-3" },
  { id: "t5", step: "Lancement officiel — Alger", status: "pending", date: "J" },
];

export const internalMemos = [
  { id: "m1", from: "PDG", subject: "Nouvelle politique de gouvernance", subjectAr: "سياسة الحوكمة الجديدة", time: "Hier" },
  { id: "m2", from: "DRH", subject: "Programme Excellence Communication", subjectAr: "برنامج التميّز في التواصل", time: "2 j." },
  { id: "m3", from: "DAF", subject: "Clôture budgétaire trimestrielle", subjectAr: "إغلاق الميزانية الفصلية", time: "4 j." },
];
