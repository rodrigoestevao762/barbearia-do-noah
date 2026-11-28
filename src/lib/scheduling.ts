/**
 * Utilitários matemáticos de disponibilidade e conflito de intervalos para agendamentos.
 * Mantém o mesmo cálculo entre a vitrine pública (/api/appointments/available),
 * criação de agendamentos (/api/appointments), reagendamento e agenda interna.
 */

export const OPERATING_HOURS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

export function timeToMinutes(hhmm: string): number {
  const [hStr, mStr] = (hhmm || "00:00").split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export interface BusyInterval {
  startMin: number;
  endMin: number;
  startTime: string;
}

/**
 * Converte um horário inicial HH:MM e duração (em minutos) para um intervalo ocupado.
 * Qualquer serviço de até 30 min ocupa pelo menos o bloco padrão de 30 min na grade.
 */
export function toBusyInterval(startTime: string, durationMinutes?: number | null): BusyInterval {
  const startMin = timeToMinutes(startTime);
  const safeDuration = Math.max(Number(durationMinutes || 30), 30);
  return {
    startMin,
    endMin: startMin + safeDuration,
    startTime,
  };
}

/**
 * Verifica se um atendimento candidato iniciando em `candidateStart` com duração `candidateDuration`
 * colide com algum intervalo ocupado (outros clientes ou pausa de almoço).
 */
export function hasIntervalConflict(
  candidateStart: string,
  candidateDuration: number | undefined | null,
  busyIntervals: BusyInterval[]
): boolean {
  const cStart = timeToMinutes(candidateStart);
  const cEnd = cStart + Math.max(Number(candidateDuration || 30), 30);
  return busyIntervals.some((b) => cStart < b.endMin && cEnd > b.startMin);
}
