import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { save } from "./storage";
import { nextDocumentNumber } from "./numbering";
import { ContractDocument } from "./templates/ContractDocument";
import { ConfirmationDocument } from "./templates/ConfirmationDocument";
import { InvoiceDocument } from "./templates/InvoiceDocument";
import type { BookingWithRelations } from "./types";

const TEMPLATES: Record<
  DocumentType,
  (props: { booking: BookingWithRelations; number: string }) => ReactElement<DocumentProps>
> = {
  CONTRACT: ContractDocument,
  CONFIRMATION: ConfirmationDocument,
  INVOICE: InvoiceDocument,
};

export async function generateDocument(bookingId: string, type: DocumentType) {
  const booking = (await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { client: true, carrier: true, vehicle: true, driver: true, request: true, offer: true },
  })) as unknown as BookingWithRelations;

  const document = await prisma.document.upsert({
    where: { bookingId_type: { bookingId, type } },
    update: { status: "PENDING" },
    create: { bookingId, type, status: "PENDING" },
  });

  try {
    const number = document.number ?? (await nextDocumentNumber(type));
    const Template = TEMPLATES[type];
    const buffer = await renderToBuffer(Template({ booking, number }));
    const relativePath = `${bookingId}/${type}.pdf`;
    await save(relativePath, buffer);

    return prisma.document.update({
      where: { id: document.id },
      data: { status: "GENERATED", number, fileUrl: relativePath },
    });
  } catch (err) {
    await prisma.document.update({ where: { id: document.id }, data: { status: "FAILED" } });
    throw err;
  }
}
