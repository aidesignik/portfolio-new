import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PREFIX: Record<DocumentType, string> = {
  CONTRACT: "CTR",
  CONFIRMATION: "CNF",
  INVOICE: "INV",
};

export async function nextDocumentNumber(type: DocumentType): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.document.count({
    where: { type, createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const sequence = String(count + 1).padStart(4, "0");
  return `${PREFIX[type]}-${year}-${sequence}`;
}
