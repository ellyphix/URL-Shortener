import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateCode(): string {
  return Array.from({ length: 7 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function createWithUniqueCode<T>(
  save: (code: string) => Promise<T>,
  nextCode: () => string = generateCode,
): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await save(nextCode());
    } catch (error) {
      // PostgreSQL's unique constraint decides if a collision happened.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Could not create a unique short code");
}