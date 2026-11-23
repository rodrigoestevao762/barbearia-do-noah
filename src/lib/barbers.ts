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
  commissionRate: number;
}

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
    bio: "Fundador e Master Barber do Noah Barber Studio. Conceito de atendimento exclusivo e personalizado em Serra - ES.",
    commissionRate: 1.0,
  },
  {
    id: "barbeiro-adrian",
    name: "Adrian Santos",
    email: "adriansantos@gmail.com",
    phone: "5527992693639",
    phoneDisplay: "(27) 99269-3638",
    role: "BARBER",
    specialty: "Cortes Modernos, Degradê & Barboterapia",
    avatar: "/barbers/adrian-santos.jpg",
    bio: "Barbeiro profissional especialista em cortes contemporâneos, acabamentos finos e barboterapia.",
    commissionRate: 0.7,
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
