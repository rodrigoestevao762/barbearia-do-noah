export interface BarberData {
  id: string;
  name: string;
  email: string;
  phone: string; // WhatsApp com DDI e DDD (ex: 5527992693638)
  phoneDisplay: string;
  role: "ADMIN" | "BARBER";
  specialty: string;
  avatar: string;
  bio: string;
  commissionRate: number; // 0.45 = 45%
  isOwner?: boolean;
}

export const OWNER_COMMISSION_RATE = 0.55; // 55% para Noah Ferreira (Dono)
export const ADRIAN_COMMISSION_RATE = 0.45; // 45% para Adrian Santos (Funcionário)
export const HOUSE_COMMISSION_RATE = 0.55; // Compatibilidade de sistema
export const BARBER_COMMISSION_RATE = 0.45;

export const BARBERS: BarberData[] = [
  {
    id: "barbeiro-noah",
    name: "Noah Ferreira",
    email: "noahbarberstudio@gmail.com",
    phone: "5527992693638",
    phoneDisplay: "(27) 99269-3638",
    role: "ADMIN",
    specialty: "Corte de Alta Precisão, Visagismo & Estilo Exclusivo",
    avatar: "/barbers/noah-ferreira.jpg",
    bio: "Fundador e Proprietário do Noah Barber Studio. Alta precisão, visagismo e atendimento de alto padrão.",
    commissionRate: 0.55,
    isOwner: true,
  },
  {
    id: "barbeiro-adrian",
    name: "Adrian Santos",
    email: "adriansantos@gmail.com",
    phone: "5527992693638",
    phoneDisplay: "(27) 99269-3638",
    role: "BARBER",
    specialty: "Cortes Modernos, Degradê & Barboterapia",
    avatar: "/barbers/adrian-santos.jpg",
    bio: "Barbeiro profissional especialista em cortes contemporâneos, acabamentos finos e barboterapia.",
    commissionRate: 0.45,
    isOwner: false,
  },
];

export function getBarberById(id?: string | null): BarberData {
  if (!id) return BARBERS[0];
  const found = BARBERS.find((b) => b.id === id);
  return found || BARBERS[0];
}

export function getBarberByEmail(email?: string | null): BarberData {
  if (!email) return BARBERS[0];
  const lower = email.toLowerCase().trim();
  const found = BARBERS.find((b) => b.email.toLowerCase() === lower);
  return found || BARBERS[0];
}
