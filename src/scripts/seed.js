const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NOAH_SERVICES = [
  { id: "combo-black", name: "Combo Black: Corte + Barba + Sobrancelha + Pigmentação", description: "Experiência definitiva VIP com corte, barba na navalha com toalha quente, pigmentação e sobrancelha.", price: 140, duration: 60 },
  { id: "corte-barba", name: "Corte & Barba", description: "Harmonização facial com corte sob medida e barba esculpida na navalha com toalha aquecida.", price: 85, duration: 45 },
  { id: "barboterapia-limpeza", name: "Barboterapia + Limpeza de Pele", description: "Barba na toalha aquecida associada a uma limpeza facial profunda com vapor de ozônio.", price: 90, duration: 45 },
  { id: "corte", name: "Corte Masculino", description: "Corte moderno ou clássico com técnica milimétrica na tesoura e máquina, acabamento e styling.", price: 45, duration: 30 },
  { id: "barba", name: "Barba", description: "Alinhamento, simetria e desenho cirúrgico da barba com toalha aquecida e navalha.", price: 45, duration: 30 },
  { id: "pezinho", name: "Pezinho (Acabamento Capilar)", description: "Alinhamento das linhas da nuca, laterais e contorno do cabelo com lâmina descartável.", price: 20, duration: 20 },
  { id: "sobrancelha", name: "Sobrancelha", description: "Limpeza e alinhamento masculino na lâmina mantendo a naturalidade.", price: 20, duration: 10 },
  { id: "pigmentacao", name: "Pigmentação", description: "Preenchimento e definição estética de falhas na barba ou cabelo com visual marcante.", price: 40, duration: 30 },
  { id: "limpeza-pele-ozonio", name: "Limpeza de Pele + Ozônio", description: "Tratamento facial com vapor de ozônio e higienização profunda para renovar a pele.", price: 65, duration: 30 },
  { id: "remocao-pelos", name: "Remoção de Pelos Nariz / Ouvido", description: "Remoção higiênica e indolor com cera morna hipoalergênica.", price: 40, duration: 15 },
  { id: "selagem-corte-hidratacao", name: "Selagem + Corte + Hidratação", description: "Alinhamento capilar térmico para redução de frizz, acompanhado de corte refinado.", price: 150, duration: 90 },
  { id: "luzes-corte-hidratacao", name: "Luzes + Corte + Hidratação", description: "Clareamento sob medida para valorizar as texturas do corte com hidratação restauradora.", price: 155, duration: 60 },
  { id: "platinado-corte-hidratacao", name: "Platinado + Corte + Hidratação", description: "Descoloração global até o tom platinado desejado com corte e reconstrução.", price: 220, duration: 60 },
  { id: "plano-4-servicos", name: "Plano 4 Serviços (30 Dias)", description: "Pacote de 4 atendimentos no mês para manter cabelo ou barba impecáveis toda semana.", price: 155, duration: 30 },
  { id: "combo-6-servicos", name: "Combo 6 Serviços (30 Dias)", description: "Assinatura completa de 6 atendimentos no mês com máxima prioridade de agenda.", price: 220, duration: 45 },
];

async function seed() {
  console.log("Seeding Barbers for Noah Barber Studio...");

  // 1. Noah Ferreira (Proprietário & Master Barber)
  await prisma.barber.upsert({
    where: { id: "barbeiro-noah" },
    update: { name: "Noah Ferreira", commissionRate: 1.0 },
    create: { id: "barbeiro-noah", name: "Noah Ferreira", commissionRate: 1.0 }
  });

  // 2. Adrian Santos (Barbeiro Profissional)
  await prisma.barber.upsert({
    where: { id: "barbeiro-adrian" },
    update: { name: "Adrian Santos", commissionRate: 0.7 },
    create: { id: "barbeiro-adrian", name: "Adrian Santos", commissionRate: 0.7 }
  });

  const pwd = await bcrypt.hash("123", 10);
  
  // Usuário Admin: Noah Ferreira
  await prisma.user.upsert({
    where: { email: "noahbarberstudio@gmail.com" },
    update: {
      name: "Noah Ferreira",
      phone: "5527992693638",
      role: "ADMIN",
      password: pwd
    },
    create: {
      id: "barbeiro-noah",
      name: "Noah Ferreira",
      email: "noahbarberstudio@gmail.com",
      phone: "5527992693638",
      role: "ADMIN",
      password: pwd
    }
  });

  // Usuário Barbeiro: Adrian Santos
  await prisma.user.upsert({
    where: { email: "adriansantos@gmail.com" },
    update: {
      name: "Adrian Santos",
      phone: "5527992693639",
      role: "BARBER",
      password: pwd
    },
    create: {
      id: "barbeiro-adrian",
      name: "Adrian Santos",
      email: "adriansantos@gmail.com",
      phone: "5527992693639",
      role: "BARBER",
      password: pwd
    }
  });

  console.log("Seeding services...");
  for (const s of NOAH_SERVICES) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { name: s.name, description: s.description, price: s.price, duration: s.duration },
      create: { id: s.id, name: s.name, description: s.description, price: s.price, duration: s.duration }
    });
  }

  const uCount = await prisma.user.count();
  const sCount = await prisma.service.count();
  const bCount = await prisma.barber.count();
  console.log("✅ Seed successfully finished! Users:", uCount, "Services:", sCount, "Barbers:", bCount);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
