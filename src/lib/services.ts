export interface ServiceItem {
  id: string;
  name: string;
  category: "combo" | "corte" | "barba" | "estetica" | "quimica";
  categoryLabel: string;
  description: string;
  price: number;
  duration: number; // minutos
  image: string;
  badge?: string;
  isCombo?: boolean;
  highlight?: boolean;
  index: string;
  tags?: string[];
  ritualSteps?: string[];
}

export const OFFICIAL_SERVICES: ServiceItem[] = [
  // ── COMBOS & RITUAIS VIP ──
  {
    id: "combo-black",
    index: "01",
    name: "Combo Black: Corte + Barba + Sobrancelha + Pigmentação",
    category: "combo",
    categoryLabel: "Combos & Rituais VIP",
    description: "A experiência definitiva do Noah Barber Studio. Corte personalizado, barba desenhada na navalha com toalha quente, pigmentação milimétrica e sobrancelha alinhada.",
    price: 140,
    duration: 60,
    image: "/studio/hero-2.webp",
    badge: "MAIS COMPLETO",
    isCombo: true,
    highlight: true,
    tags: ["Experiência VIP", "Toalha Quente", "Pigmentação", "Navalha de Precisão"],
    ritualSteps: [
      "Consultoria de visagismo e harmonia facial",
      "Corte de alta precisão com acabamento impecável",
      "Barboterapia completa com toalha aquecida e navalha",
      "Pigmentação para preenchimento e realce de linhas",
      "Design de sobrancelha e styling final"
    ]
  },
  {
    id: "corte-barba",
    index: "02",
    name: "Corte & Barba",
    category: "combo",
    categoryLabel: "Combos & Rituais VIP",
    description: "A assinatura indispensável para sua imagem pessoal. Harmonização facial completa com corte sob medida e barba modelada na navalha com toalha quente e bálsamo nobre.",
    price: 85,
    duration: 45,
    image: "/services/corte-barba-real.jpg",
    badge: "MAIS ESCOLHIDO",
    isCombo: true,
    highlight: true,
    tags: ["Assinatura Clássica", "Toalha Quente", "Modelagem Navalha"],
    ritualSteps: [
      "Análise de estilo e proporções faciais",
      "Corte e texturização capilar",
      "Emoliência com toalha quente e espuma densa",
      "Navalha clássica, alinhamento e hidratação"
    ]
  },
  {
    id: "barboterapia-limpeza",
    index: "03",
    name: "Barboterapia + Limpeza de Pele",
    category: "combo",
    categoryLabel: "Combos & Rituais VIP",
    description: "Um verdadeiro spa facial masculino. Barba desenhada com toalha quente associada a uma limpeza facial profunda para desobstruir os poros e renovar a pele.",
    price: 90,
    duration: 45,
    image: "/services/barbaterapia.jpg",
    badge: "SPA FACIAL",
    isCombo: true,
    highlight: true,
    tags: ["Spa Facial", "Vapor de Ozônio", "Toalha Quente"],
  },

  // ── CORTES DE PRECISÃO ──
  {
    id: "corte",
    index: "04",
    name: "Corte Masculino",
    category: "corte",
    categoryLabel: "Cortes de Precisão",
    description: "Corte moderno ou clássico executado com técnica milimétrica na tesoura e máquina. Acabamento fino, higienização e styling com pomada nobre.",
    price: 45,
    duration: 30,
    image: "/services/corte-cabelo.jpg",
    badge: "ALTA PRECISÃO",
    highlight: true,
    tags: ["Corte Sob Medida", "Acabamento Fino", "Styling Nobre"],
  },
  {
    id: "pezinho",
    index: "05",
    name: "Pezinho (Acabamento Capilar)",
    category: "corte",
    categoryLabel: "Cortes de Precisão",
    description: "Alinhamento das linhas da nuca, laterais e contorno do cabelo com máquina e lâmina descartável para manter o visual sempre impecável.",
    price: 20,
    duration: 20,
    image: "/services/navalha-gel.jpg",
    badge: "MANUTENÇÃO",
    tags: ["Contorno Nítido", "Lâmina Afiada", "Rápido & Pontual"],
  },

  // ── BARBA & ALINHAMENTO ──
  {
    id: "barba",
    index: "06",
    name: "Barba",
    category: "barba",
    categoryLabel: "Barba & Cuidados",
    description: "Alinhamento, simetria e desenho cirúrgico da barba com navalhete descartável, toalha aquecida e massagem relaxante com óleos essenciais.",
    price: 45,
    duration: 30,
    image: "/services/barba-clipper-gold.jpg",
    badge: "ALINHAMENTO & TOALHA",
    highlight: true,
    tags: ["Toalha Quente", "Navalha Clássica", "Óleos Essenciais"],
  },
  {
    id: "pigmentacao",
    index: "07",
    name: "Pigmentação",
    category: "barba",
    categoryLabel: "Barba & Cuidados",
    description: "Preenchimento e definição estética de falhas na barba ou cabelo. Proporciona densidade visual uniforme, contorno nítido e visual marcante com pigmento seguro.",
    price: 40,
    duration: 30,
    image: "/services/pigmentacao.jpg",
    badge: "DENSIDADE & DEFINIÇÃO",
    tags: ["Preenchimento", "Contorno Nítido", "Visual Marcante"],
  },

  // ── ESTÉTICA & TRATAMENTOS ──
  {
    id: "sobrancelha",
    index: "08",
    name: "Sobrancelha",
    category: "estetica",
    categoryLabel: "Estética & Tratamentos",
    description: "Limpeza cirúrgica do excesso de fios na lâmina e pinça, respeitando o formato natural masculino para abrir o olhar com sobriedade.",
    price: 20,
    duration: 10,
    image: "/services/sobrancelha.jpg",
    badge: "DESIGN CIRÚRGICO",
    tags: ["Design Masculino", "Navalha de Precisão", "Naturalidade"],
  },
  {
    id: "limpeza-pele-ozonio",
    index: "09",
    name: "Limpeza de Pele + Ozônio",
    category: "estetica",
    categoryLabel: "Estética & Tratamentos",
    description: "Tratamento facial com vapor de ozônio e higienização profunda para remoção de impurezas, oleosidade e prevenção de foliculite.",
    price: 65,
    duration: 30,
    image: "/services/barbaterapia.jpg",
    badge: "OZÔNIO & SAÚDE",
    tags: ["Vapor de Ozônio", "Pele Renovada", "Anti-Foliculite"],
  },
  {
    id: "remocao-pelos",
    index: "10",
    name: "Remoção de Pelos Nariz / Ouvido",
    category: "estetica",
    categoryLabel: "Estética & Tratamentos",
    description: "Remoção higiênica e indolor com cera morna hipoalergênica. Acabamento polido e assepsia profunda em minutos.",
    price: 40,
    duration: 15,
    image: "/services/depilacao.jpg",
    badge: "HIGIENE TOTAL",
    tags: ["Cera Hipoalergênica", "Rápido & Indolor", "Assepsia"],
  },

  // ── QUÍMICA & TRANSFORMAÇÃO ──
  {
    id: "selagem-corte-hidratacao",
    index: "11",
    name: "Selagem + Corte + Hidratação",
    category: "quimica",
    categoryLabel: "Química & Transformação",
    description: "Alinhamento capilar térmico para redução de volume e frizz, acompanhado de corte refinado e hidratação profunda de fios.",
    price: 150,
    duration: 90,
    image: "/services/hidratacao.jpg",
    badge: "ALINHAMENTO TÉRMICO",
    tags: ["Redução de Frizz", "Corte Completo", "Nutrição Intensa"],
  },
  {
    id: "luzes-corte-hidratacao",
    index: "12",
    name: "Luzes + Corte + Hidratação",
    category: "quimica",
    categoryLabel: "Química & Transformação",
    description: "Clareamento sob medida (mechas ou reflexos) para valorizar as texturas do corte com acabamento harmônico e hidratação restauradora.",
    price: 155,
    duration: 60,
    image: "/services/corte-tesoura.jpg",
    badge: "MECHAS & TEXTURA",
    tags: ["Clareamento Seguro", "Corte sob Medida", "Reconstrução"],
  },
  {
    id: "platinado-corte-hidratacao",
    index: "13",
    name: "Platinado + Corte + Hidratação",
    category: "quimica",
    categoryLabel: "Química & Transformação",
    description: "Descoloração global até o tom platinado desejado, corte de alta precisão e reposição profunda de massa capilar.",
    price: 220,
    duration: 60,
    image: "/services/studio-privativo.jpg",
    badge: "VISUAL IMPACTO",
    tags: ["Platinado Global", "Matização Nobre", "Corte de Precisão"],
  },

  // ── PLANOS MENSAIS RECORRENTES ──
  {
    id: "plano-4-servicos",
    index: "14",
    name: "Plano 4 Serviços (30 Dias)",
    category: "combo",
    categoryLabel: "Planos Mensais VIP",
    description: "Pacote de 4 atendimentos no mês para manter cabelo ou barba impecáveis toda semana com máxima economia e prioridade de agenda.",
    price: 155,
    duration: 30,
    image: "/studio/hero-1.jpg",
    badge: "PLANO MENSAL",
    isCombo: true,
    tags: ["4 Atendimentos", "Economia Inteligente", "Visual Sempre Alinhado"],
  },
  {
    id: "combo-6-servicos",
    index: "15",
    name: "Combo 6 Serviços (30 Dias)",
    category: "combo",
    categoryLabel: "Planos Mensais VIP",
    description: "Assinatura completa de 6 atendimentos no mês. Ideal para quem exige cabelo, barba e sobrancelha perfeitos com atendimento premium.",
    price: 220,
    duration: 45,
    image: "/studio/hero-3.webp",
    badge: "PLANO PREMIUM",
    isCombo: true,
    tags: ["6 Atendimentos", "Corte + Barba Semanal", "Máxima Prioridade"],
  },
];

export function getServiceById(id?: string | null): ServiceItem | undefined {
  if (!id) return undefined;
  const lower = id.toLowerCase().trim();

  // Compatibilidade com IDs antigos
  if (lower === "corte" || lower === "corte-cabelo") return OFFICIAL_SERVICES.find((s) => s.id === "corte");
  if (lower === "combo-corte-barba" || lower === "corte&barba") return OFFICIAL_SERVICES.find((s) => s.id === "corte-barba");
  if (lower === "combo-completo" || lower === "combo-corte-barba-sobrancelha") return OFFICIAL_SERVICES.find((s) => s.id === "combo-black");

  return OFFICIAL_SERVICES.find(
    (s) => s.id === id || s.name.toLowerCase() === lower || s.id === lower
  );
}
