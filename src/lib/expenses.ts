export type ExpenseCategory = "FIXA" | "INSUMOS" | "VALE" | "OUTROS";

export interface ParsedExpense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  barberId: "studio" | "barbeiro-noah" | "barbeiro-adrian";
  barberName?: string;
  date: string;
  createdAt: string;
}

const META_REGEX = /\s*\[\[CAT:(FIXA|INSUMOS|VALE|OUTROS)\|BARBER:(studio|barbeiro-noah|barbeiro-adrian)\]\]\s*$/;

export function encodeExpenseDescription(
  description: string,
  category: ExpenseCategory = "OUTROS",
  barberId: "studio" | "barbeiro-noah" | "barbeiro-adrian" = "studio"
): string {
  const clean = description.replace(META_REGEX, "").trim().slice(0, 180);
  return `${clean} [[CAT:${category}|BARBER:${barberId}]]`;
}

export function parseExpenseRecord(exp: {
  id: string;
  description: string;
  amount: number;
  date: Date | string;
  createdAt?: Date | string;
}): ParsedExpense {
  const raw = exp.description || "";
  const match = raw.match(META_REGEX);

  let category: ExpenseCategory = "OUTROS";
  let barberId: "studio" | "barbeiro-noah" | "barbeiro-adrian" = "studio";
  let cleanDescription = raw;

  if (match) {
    category = match[1] as ExpenseCategory;
    barberId = match[2] as "studio" | "barbeiro-noah" | "barbeiro-adrian";
    cleanDescription = raw.replace(META_REGEX, "").trim();
  }

  const barberName =
    barberId === "barbeiro-adrian"
      ? "Adrian Santos"
      : barberId === "barbeiro-noah"
      ? "Noah Ferreira"
      : undefined;

  return {
    id: exp.id,
    description: cleanDescription,
    amount: Number(exp.amount) || 0,
    category,
    barberId,
    barberName,
    date: typeof exp.date === "string" ? exp.date : exp.date.toISOString(),
    createdAt: exp.createdAt
      ? typeof exp.createdAt === "string"
        ? exp.createdAt
        : exp.createdAt.toISOString()
      : typeof exp.date === "string"
      ? exp.date
      : exp.date.toISOString(),
  };
}
