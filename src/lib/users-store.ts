import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

export interface StoredUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  plainPasswordFallback?: string;
  role: "ADMIN" | "BARBER" | "CLIENT";
  barberId?: string | null;
  createdAt: string;
  aliases?: string[];
}

// Caminho de persistência em disco para sobreviver a recargas e ambientes serverless
const DISK_FILE = 
  process.env.VERCEL || process.env.NODE_ENV === "production"
    ? path.join("/tmp", "noah_users.json")
    : path.join(process.cwd(), "src", "data", "users.json");

// Usuários iniciais oficiais pré-configurados (Noah Ferreira & Adrian Santos)
const INITIAL_USERS: StoredUser[] = [
  // 1. Noah Ferreira (Proprietário, Master Barber & Admin)
  {
    id: "barbeiro-noah",
    name: "Noah Ferreira",
    email: "noahbarberstudio@gmail.com",
    phone: "5527992693638",
    passwordHash: "$2b$10$3nbfFPEGUEz5IOBYGT4GXOax0/yVHF25z9UJHNc8qTYD9aDCU5ulO",
    plainPasswordFallback: "123",
    role: "ADMIN",
    barberId: "barbeiro-noah",
    createdAt: "2026-01-01T00:00:00.000Z",
    aliases: ["27992693638", "(27) 99269-3638", "992693638", "noah", "noah ferreira"],
  },
  // 2. Adrian Santos (Barbeiro Profissional)
  {
    id: "barbeiro-adrian",
    name: "Adrian Santos",
    email: "adriansantos@gmail.com",
    phone: "5527992693639",
    passwordHash: "$2b$10$3nbfFPEGUEz5IOBYGT4GXOax0/yVHF25z9UJHNc8qTYD9aDCU5ulO",
    plainPasswordFallback: "123",
    role: "BARBER",
    barberId: "barbeiro-adrian",
    createdAt: "2026-01-01T00:00:00.000Z",
    aliases: ["27992693639", "(27) 99269-3639", "992693639", "adrian", "adrian santos"],
  },
];

declare global {
  var __noah_users: StoredUser[] | undefined;
}

function loadUsersFromDisk(): StoredUser[] {
  try {
    if (fs.existsSync(DISK_FILE)) {
      const raw = fs.readFileSync(DISK_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          (u) => !u.name?.toLowerCase().includes("almir") && 
                 !u.id?.includes("almir") &&
                 !u.id?.includes("cliente-teste") &&
                 u.email !== "cliente@teste.com"
        );
      }
    }
  } catch (_) {}
  return [];
}

function saveUsersToDisk(users: StoredUser[]): void {
  try {
    const dir = path.dirname(DISK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISK_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (_) {}
}

export function getAllStoredUsers(): StoredUser[] {
  if (!global.__noah_users || global.__noah_users.length === 0) {
    const fromDisk = loadUsersFromDisk();
    if (fromDisk.length > 0) {
      global.__noah_users = fromDisk;
    } else {
      global.__noah_users = [...INITIAL_USERS];
      saveUsersToDisk(global.__noah_users);
    }
  }
  return (global.__noah_users || []).filter(
    (u) => !u.name?.toLowerCase().includes("almir") && !u.id?.includes("almir")
  );
}

export function findStoredUserById(id: string): StoredUser | undefined {
  const users = getAllStoredUsers();
  return users.find((u) => u.id === id);
}

export function findStoredUserByEmailOrPhone(identifier: string): StoredUser | undefined {
  if (!identifier) return undefined;
  const users = getAllStoredUsers();
  const trimmed = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, "");

  return users.find((u) => {
    // 1. Comparação de Email
    if (u.email && u.email.toLowerCase() === trimmed) {
      return true;
    }

    // 2. Comparação de Aliases (emails alternativos)
    if (u.aliases && u.aliases.some((a) => a.toLowerCase() === trimmed)) {
      return true;
    }

    // 3. Comparação de Telefone
    if (cleanPhone && u.phone) {
      const uPhoneDigits = u.phone.replace(/\D/g, "");
      if (
        uPhoneDigits === cleanPhone ||
        uPhoneDigits.endsWith(cleanPhone) ||
        cleanPhone.endsWith(uPhoneDigits) ||
        (cleanPhone.length >= 8 && uPhoneDigits.includes(cleanPhone))
      ) {
        return true;
      }
    }

    // 4. Comparação de Aliases de Telefone
    if (cleanPhone && u.aliases) {
      for (const alias of u.aliases) {
        const aliasDigits = alias.replace(/\D/g, "");
        if (
          aliasDigits &&
          (aliasDigits === cleanPhone ||
            aliasDigits.endsWith(cleanPhone) ||
            cleanPhone.endsWith(aliasDigits) ||
            (cleanPhone.length >= 8 && aliasDigits.includes(cleanPhone)))
        ) {
          return true;
        }
      }
    }

    return false;
  });
}

export function upsertStoredUser(data: {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  password?: string;
  role?: "ADMIN" | "CLIENT";
}): StoredUser {
  const users = getAllStoredUsers();
  const formattedEmail = data.email ? data.email.trim().toLowerCase() : null;
  const cleanPhone = data.phone ? data.phone.replace(/\D/g, "") : null;
  const pwd = data.password ? data.password.trim() : Math.random().toString(36).slice(-8);

  // Busca se já existe por e-mail ou telefone
  let existingIndex = -1;
  if (formattedEmail || cleanPhone) {
    existingIndex = users.findIndex((u) => {
      if (formattedEmail && u.email && u.email.toLowerCase() === formattedEmail) return true;
      if (cleanPhone && u.phone) {
        const uPhoneDigits = u.phone.replace(/\D/g, "");
        if (uPhoneDigits === cleanPhone || uPhoneDigits.endsWith(cleanPhone) || cleanPhone.endsWith(uPhoneDigits)) {
          return true;
        }
      }
      return false;
    });
  }

  const passwordHash = bcrypt.hashSync(pwd, 10);

  if (existingIndex >= 0) {
    const existing = users[existingIndex];
    const updated: StoredUser = {
      ...existing,
      name: data.name?.trim() || existing.name,
      email: formattedEmail || existing.email,
      phone: cleanPhone || existing.phone,
      passwordHash: passwordHash,
      plainPasswordFallback: pwd,
    };
    users[existingIndex] = updated;
    global.__noah_users = users;
    saveUsersToDisk(users);
    return updated;
  }

  const newUser: StoredUser = {
    id: data.id || `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name?.trim() || "Cliente VIP",
    email: formattedEmail,
    phone: cleanPhone,
    passwordHash: passwordHash,
    plainPasswordFallback: pwd,
    role: data.role || "CLIENT",
    createdAt: new Date().toISOString(),
    aliases: cleanPhone ? [cleanPhone, `(27) ${cleanPhone.slice(-9)}`] : [],
  };

  users.unshift(newUser);
  global.__noah_users = users;
  saveUsersToDisk(users);
  return newUser;
}

export function clearAllStoredUsersExceptAdmin(): void {
  global.__noah_users = [...INITIAL_USERS];
  saveUsersToDisk(global.__noah_users);
}
